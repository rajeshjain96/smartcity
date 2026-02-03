import React, { useState, useRef } from 'react';
import axios from 'axios';
// import 'bootstrap/dist/css/bootstrap.min.css';

function UploadForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    profileImage: null,
    documents: []
  });

  const [preview, setPreview] = useState({
    profile: null,
    documents: []
  });

  const profileInputRef = useRef();
  const documentInputRef = useRef();

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === 'profileImage') {
      const file = files[0];

      if (file) {
        setFormData((prev) => ({ ...prev, profileImage: file }));

        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setPreview((prev) => ({ ...prev, profile: reader.result }));
          };
          reader.readAsDataURL(file);
        } else {
          setPreview((prev) => ({ ...prev, profile: null }));
        }
      }
    } else if (name === 'documents') {
      const fileArray = Array.from(files);

      const newDocs = [];
      const newPreviews = [];

      fileArray.forEach((file) => {
        newDocs.push(file);

        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setPreview((prev) => ({
              ...prev,
              documents: [...prev.documents, { url: reader.result, name: file.name, file }]
            }));
          };
          reader.readAsDataURL(file);
        } else {
          newPreviews.push({ url: null, name: file.name, file });
        }
      });

      setFormData((prev) => ({
        ...prev,
        documents: [...prev.documents, ...fileArray]
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const clearProfileImage = () => {
    setFormData((prev) => ({ ...prev, profileImage: null }));
    setPreview((prev) => ({ ...prev, profile: null }));
    if (profileInputRef.current) profileInputRef.current.value = '';
  };

  const removeDocument = (index) => {
    const newDocs = [...formData.documents];
    const newPreviews = [...preview.documents];
    newDocs.splice(index, 1);
    newPreviews.splice(index, 1);
    setFormData((prev) => ({ ...prev, documents: newDocs }));
    setPreview((prev) => ({ ...prev, documents: newPreviews }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('name', formData.name);
    data.append('email', formData.email);
    if (formData.profileImage) {
      data.append('profileImage', formData.profileImage);
    }
    formData.documents.forEach((doc) => data.append('documents', doc));

    try {
      const res = await axios.post('http://localhost:5000/api/upload', data);
      alert('Upload successful!');
      console.log(res.data);
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    }
  };

  return (
    <div className="container mt-5">
      <h3 className="mb-4">User Upload Form</h3>
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <div className="mb-3">
          <label className="form-label">Name:</label>
          <input className="form-control" name="name" onChange={handleChange} required />
        </div>
        <div className="mb-3">
          <label className="form-label">Email:</label>
          <input className="form-control" name="email" type="email" onChange={handleChange} required />
        </div>
        <div className="mb-3">
          <label className="form-label">Profile Image:</label>
          <input
            className="form-control"
            name="profileImage"
            type="file"
            accept="image/*"
            onChange={handleChange}
            ref={profileInputRef}
          />
          {preview.profile && (
            <div className="mt-2 position-relative d-inline-block">
              <img src={preview.profile} alt="Profile Preview" className="img-thumbnail" style={{ maxWidth: '200px' }} />
              <button
                type="button"
                className="btn btn-sm btn-danger position-absolute top-0 end-0"
                onClick={clearProfileImage}
              >
                ×
              </button>
            </div>
          )}
        </div>
        <div className="mb-3">
          <label className="form-label">Documents:</label>
          <input
            className="form-control"
            name="documents"
            type="file"
            multiple
            onChange={handleChange}
            ref={documentInputRef}
          />
          <div className="mt-2">
            {preview.documents.map((doc, idx) => (
              <div key={idx} className="d-flex align-items-center gap-3 mb-2">
                {doc.url ? (
                  <img src={doc.url} alt={`doc-${idx}`} className="img-thumbnail" style={{ width: '100px' }} />
                ) : (
                  <div className="text-muted">No preview</div>
                )}
                <span>{doc.name}</span>
                <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeDocument(idx)}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
        <button className="btn btn-primary mt-3" type="submit">
          Submit
        </button>
      </form>
    </div>
  );
}

export default UploadForm;
