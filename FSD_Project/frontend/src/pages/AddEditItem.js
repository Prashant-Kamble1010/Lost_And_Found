import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api";

function AddEditItem() {
  const locationHook = useLocation();
  const navigate = useNavigate();
  const editItem = locationHook.state?.editItem;
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    location: "",
    status: "LOST",
    contactInfo: ""
  });
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (editItem) {
      setForm({
        name: editItem.name || "",
        description: editItem.description || "",
        category: editItem.category || "",
        location: editItem.location || "",
        status: editItem.status || "LOST",
        contactInfo: editItem.contactInfo || ""
      });
      return;
    }
  }, [editItem]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFiles = (fileList) => {
    const files = Array.from(fileList || []);
    const first = files.find((f) => (f?.type || "").startsWith("image/"));
    if (first) {
      setImageFile(first);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleFileSelect = async (e) => {
    handleFiles(e.target.files);
  };

  const previewUrl = useMemo(() => (imageFile ? URL.createObjectURL(imageFile) : null), [imageFile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    const token = localStorage.getItem("token");
    if (!token) {
      setMessage("Please login first.");
      return;
    }
    setIsLoading(true);
    try {
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("description", form.description || "");
      fd.append("category", form.category);
      fd.append("location", form.location);
      fd.append("contactInfo", form.contactInfo || "");
      if (editItem) {
        fd.append("status", form.status);
      }
      if (imageFile) {
        fd.append("image", imageFile);
      }

      let response;
      if (editItem) {
        response = await api.put(`/items/${editItem.id}`, fd, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        setMessage("Item updated successfully.");
      } else {
        response = await api.post("/items", fd, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        setMessage("Item saved successfully.");
      }

      setForm({
        name: "",
        description: "",
        category: "",
        location: "",
        status: "LOST",
        contactInfo: ""
      });
      setImageFile(null);
      setTimeout(() => navigate("/dashboard"), 800);
    } catch (error) {
      const msg = error.response?.data?.message || "Item save failed.";
      setMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="panel">
      <h3>Add / Edit Item</h3>
      <p className="helper-text">
        Create a LOST item under your account. Only the owner can edit/delete it.
      </p>
      <form className="item-form" onSubmit={handleSubmit}>
        <input name="name" value={form.name} placeholder="Item name" onChange={handleChange} required />
        <input name="description" value={form.description} placeholder="Description" onChange={handleChange} />
        <input name="category" value={form.category} placeholder="Category" onChange={handleChange} required />
        <input name="location" value={form.location} placeholder="Location" onChange={handleChange} required />
        {editItem ? (
          <select name="status" value={form.status} onChange={handleChange}>
            <option value="LOST">LOST</option>
            <option value="FOUND">FOUND</option>
            <option value="CLAIMED">CLAIMED</option>
          </select>
        ) : null}
        <input name="contactInfo" value={form.contactInfo} placeholder="Contact Info" onChange={handleChange} />
        <div
          className={`upload-dropzone ${isDragActive ? "drag-active" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragActive(true);
          }}
          onDragLeave={() => setIsDragActive(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            className="hidden-file-input"
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
          />
          <p className="upload-title">Item Image</p>
          <p className="helper-text">Drag and drop an image here, or click to browse.</p>
        </div>
        {previewUrl ? (
          <div className="preview-grid">
            <div className="preview-card">
              <img src={previewUrl} alt="Selected item" />
              <div className="preview-card-footer">
                <span>{imageFile?.name}</span>
                <button type="button" className="ghost-btn" onClick={() => setImageFile(null)}>
                  Remove
                </button>
              </div>
            </div>
          </div>
        ) : null}
        <button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : editItem ? "Update Item" : "Save Item"}
        </button>
      </form>
      {message ? <p className={message.includes("saved") ? "success-text" : "error-text"}>{message}</p> : null}
    </div>
  );
}

export default AddEditItem;
