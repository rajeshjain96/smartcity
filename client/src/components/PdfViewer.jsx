import React, { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";

// ✅ Use working version of pdf.js hosted on CDN
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js`;

export default function PdfViewer() {
  const [file, setFile] = useState(null);
  const [numPages, setNumPages] = useState(null);

  const handleFileChange = (e) => {
    const uploaded = e.target.files[0];
    if (uploaded?.type === "application/pdf") {
      setFile(uploaded);
    } else {
      alert("Please upload a valid PDF.");
    }
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  return (
    <div className="container mt-4">
      <h4>PDF Viewer</h4>
      <input
        type="file"
        accept="application/pdf"
        onChange={handleFileChange}
        className="form-control mb-3"
      />

      {file && (
        <Document file={file} onLoadSuccess={onDocumentLoadSuccess}>
          {Array.from({ length: numPages }, (_, index) => (
            <Page key={index + 1} pageNumber={index + 1} />
          ))}
        </Document>
      )}
    </div>
  );
}
