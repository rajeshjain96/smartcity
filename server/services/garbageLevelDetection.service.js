const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

// Use 127.0.0.1 instead of localhost to avoid IPv6 ::1 resolution issues on Windows.
const DEFAULT_FLASK_URL = "http://127.0.0.1:5001/predict";

/**
 * detectGarbageLevel(filePath)
 * - Sends the uploaded image to the Flask AI service
 * - Returns { status: "Empty"|"Half"|"Full", error?: string }
 */
async function detectGarbageLevel(filePath) {
  const flaskUrl = process.env.AI_SERVICE_URL || DEFAULT_FLASK_URL;

  try {
    const resolved = path.resolve(filePath);
    if (!fs.existsSync(resolved)) {
      return { status: null, error: "Uploaded file not found on server" };
    }

    const stream = fs.createReadStream(resolved);
    const streamReady = new Promise((resolve, reject) => {
      stream.once("open", resolve);
      stream.once("error", reject);
    });
    await streamReady;

    const form = new FormData();
    form.append("image", stream, path.basename(resolved));

    const response = await axios.post(flaskUrl, form, {
      headers: form.getHeaders(),
      timeout: 8000,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      validateStatus: (s) => s >= 200 && s < 500,
    });

    if (response.status >= 400) {
      const msg =
        response.data && response.data.error
          ? response.data.error
          : `AI service error (${response.status})`;
      return { status: null, error: msg };
    }

    const status = response.data && response.data.status ? String(response.data.status) : null;
    if (status !== "Empty" && status !== "Half" && status !== "Full") {
      return { status: null, error: "AI service returned invalid status" };
    }

    return { status };
  } catch (err) {
    const msg =
      err && err.code === "ECONNREFUSED"
        ? "AI service is not running"
        : err && err.code === "ECONNABORTED"
          ? "AI service timed out"
          : err && err.message
            ? err.message
            : "AI service request failed";
    return { status: null, error: msg };
  }
}

module.exports = { detectGarbageLevel };

