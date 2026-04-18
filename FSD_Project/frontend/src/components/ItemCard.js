import React from "react";
import { mediaUrl } from "../api";

function ItemCard({ item, onEdit, onDelete, onReportFound, onOpenGallery, canManage }) {
  const statusClass = `status-chip status-${(item.status || "").toLowerCase()}`;
  const previewImage = item.image ? mediaUrl(item.image) : "https://via.placeholder.com/600x320?text=No+Image";
  const galleryImages = item.image ? [mediaUrl(item.image)] : [];

  return (
    <div className="item-card">
      <img
        src={previewImage}
        alt={item.name}
        className={galleryImages.length ? "clickable-image" : ""}
        onClick={() => galleryImages.length && onOpenGallery(item.name, galleryImages)}
      />
      <div className="item-card-content">
        <div className="item-card-header">
          <h3>{item.name}</h3>
          <span className={statusClass}>{item.status}</span>
        </div>
        <p className="item-description">{item.description || "No description provided."}</p>
        <div className="item-metadata">
          <span>Category: {item.category || "-"}</span>
          <span>Location: {item.location || "-"}</span>
          <span>Contact: {item.contactInfo || "-"}</span>
          <span>Owner: {item.createdBy?.name || item.legacyOwner?.name || "-"}</span>
        </div>
        <div className="item-actions">
          {galleryImages.length ? (
            <button type="button" className="ghost-btn" onClick={() => onOpenGallery(item.name, galleryImages)}>
              View Images
            </button>
          ) : null}
          {canManage ? (
            <>
              <button type="button" onClick={() => onEdit(item)}>Edit</button>
              <button type="button" className="ghost-btn" onClick={() => onDelete(item.id)}>Delete</button>
            </>
          ) : null}
          {item.status === "LOST" ? (
            <button type="button" className="ghost-btn" onClick={() => onReportFound(item)}>
              Report Found
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default ItemCard;
