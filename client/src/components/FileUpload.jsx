import React, { useState } from 'react';

const FileUpload = () => {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState('');

  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  const maxSize = 2 * 1024 * 1024; // 2MB

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];

    if (!selectedFile) return;

    // Validate type
    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Invalid file type. Only JPG, PNG, GIF allowed.');
      setFile(null);
      setPreviewUrl(null);
      return;
    }

    // Validate size
    if (selectedFile.size > maxSize) {
      setError('File size exceeds 2MB limit.');
      setFile(null);
      setPreviewUrl(null);
      return;
    }

    // If valid
    setFile(selectedFile);
    setError('');

    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result);
    reader.readAsDataURL(selectedFile);
  };

  return (
    <div className="container mt-4">
      <h4 className="mb-3">Upload an Image File</h4>

      <div className="mb-3">
        <input
          type="file"
          className="form-control"
          onChange={handleFileChange}
          accept="image/*"
        />
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {previewUrl && (
        <div className="mt-3">
          <p><strong>Preview:</strong></p>
          <img
            src={previewUrl}
            alt="Preview"
            className="img-thumbnail"
            style={{ maxWidth: '300px' }}
          />
        </div>
      )}
    </div>
  );
};

export default FileUpload;
