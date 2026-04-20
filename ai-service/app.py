from __future__ import annotations

import io
import os
from typing import Literal

import numpy as np
from flask import Flask, jsonify, request
from PIL import Image, ImageOps

GarbageLevel = Literal["Empty", "Half", "Full"]

app = Flask(__name__)

def _validate_dustbin_like(arr01: np.ndarray) -> tuple[bool, str]:
    """
    Very lightweight guardrail to reject obvious non-dustbin inputs such as
    QR codes, UI screenshots, or documents.

    Heuristics (fast, no ML):
    - High edge density (lots of hard transitions), common in QR/text/UI
    - Large near-binary pixel fraction (mostly black/white)
    - Low histogram entropy (few tones, document-like)
    """
    # arr01 is grayscale in [0, 1]
    a = arr01.astype(np.float32)

    # Edge density via simple finite differences
    gx = np.abs(a[:, 1:] - a[:, :-1])
    gy = np.abs(a[1:, :] - a[:-1, :])
    edge_density = float(((gx > 0.18).mean() + (gy > 0.18).mean()) / 2.0)

    # Approximate gray-level diversity
    levels = int(np.unique((a * 255).astype(np.uint8)).size)

    # Near-binary fraction (QR/text/doc often heavily black/white)
    near_binary = float(((a < 0.10) | (a > 0.90)).mean())

    # Histogram entropy (lower => fewer tones; docs/QR are very low)
    hist, _ = np.histogram(a, bins=64, range=(0.0, 1.0), density=True)
    p = hist / (hist.sum() + 1e-9)
    entropy = float(-(p * np.log2(p + 1e-12)).sum())

    # Decision rules (QR / text / screenshot / docs)
    if edge_density > 0.22 and near_binary > 0.55:
        return False, "Not a dustbin image (looks like QR/text/screenshot)"
    if edge_density > 0.20 and levels < 90:
        return False, "Not a dustbin image (too few tones; document-like)"
    if entropy < 4.2 and near_binary > 0.45:
        return False, "Not a dustbin image (low-detail, document-like)"

    # "Random photo" guardrail (still heuristic):
    # Require the main subject to be reasonably centered/prominent.
    # Many dustbin photos are taken with the bin centered; generic photos often are not.
    h, w = a.shape
    y0, y1 = int(h * 0.20), int(h * 0.80)
    x0, x1 = int(w * 0.20), int(w * 0.80)
    center = a[y0:y1, x0:x1]
    outer_mask = np.ones_like(a, dtype=bool)
    outer_mask[y0:y1, x0:x1] = False
    outer = a[outer_mask]

    # Edge density for center vs outer
    cgx = np.abs(center[:, 1:] - center[:, :-1])
    cgy = np.abs(center[1:, :] - center[:-1, :])
    center_edge = float(((cgx > 0.18).mean() + (cgy > 0.18).mean()) / 2.0)

    outer2d = a.copy()
    outer2d[y0:y1, x0:x1] = np.nan
    # compute outer edges by using full-frame edges but discount center by weight
    # (approximation; keeps this fast/simple)
    outer_edge = edge_density * 0.75

    if center_edge < (outer_edge + 0.01) and entropy > 4.8 and near_binary < 0.40:
        return False, "Not a dustbin image (please upload a clear dustbin photo)"

    return True, ""


def predict_garbage_level(image: Image.Image) -> GarbageLevel:
    """
    Lightweight heuristic:
    - Convert to grayscale, downscale for speed
    - Compute "occupancy" as fraction of darker pixels (relative to mean)
    - Map occupancy to Empty/Half/Full
    """
    img = ImageOps.exif_transpose(image).convert("L").resize((160, 160))
    arr = np.asarray(img, dtype=np.float32) / 255.0

    # Guardrail: reject obvious non-dustbin images (QR/screenshot/document)
    ok, reason = _validate_dustbin_like(arr)
    if not ok:
        raise ValueError(reason or "Not a dustbin image")

    mean_brightness = float(arr.mean())
    dark_threshold = max(0.0, mean_brightness - 0.10)
    dark_fraction = float((arr < dark_threshold).mean())

    # Combine with inverse brightness to stabilize across lighting conditions
    occupancy = 0.60 * dark_fraction + 0.40 * (1.0 - mean_brightness)

    if occupancy < 0.28:
        return "Empty"
    if occupancy < 0.52:
        return "Half"
    return "Full"


@app.post("/predict")
def predict():
    if not request.files:
        return jsonify({"error": "No image file provided"}), 400

    # Accept any multipart field name; use the first file.
    file_storage = next(iter(request.files.values()))
    if not file_storage or not file_storage.filename:
        return jsonify({"error": "Invalid image file"}), 400

    try:
        raw = file_storage.read()
        image = Image.open(io.BytesIO(raw))
        status = predict_garbage_level(image)
        return jsonify({"status": status})
    except ValueError as ve:
        # Input doesn't resemble a dustbin photo
        return jsonify({"error": str(ve)}), 422
    except Exception as e:
        return jsonify({"error": f"Failed to process image: {str(e)}"}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5001"))
    app.run(host="0.0.0.0", port=port, debug=True)

