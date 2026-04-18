import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { mediaUrl } from "../api";
import ItemCard from "../components/ItemCard";

function Dashboard() {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");
  const [myItems, setMyItems] = useState([]);
  const [otherItems, setOtherItems] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [notifError, setNotifError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [galleryState, setGalleryState] = useState({ open: false, title: "", images: [], activeIndex: 0 });
  const [reportModal, setReportModal] = useState({ open: false, item: null, contactInfo: "", imageFile: null, submitting: false });
  const [filters, setFilters] = useState({ q: "", category: "", location: "", status: "" });

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [myRes, otherRes] = await Promise.all([
        api.get("/items/my-items"),
        api.get("/items/others")
      ]);
      setMyItems(myRes.data || []);
      setOtherItems(otherRes.data || []);

      setNotifError("");
      try {
        const notifRes = await api.get("/notifications/my");
        setNotifications(notifRes.data || []);
      } catch (ne) {
        const nmsg = ne.response?.data?.message || "Could not load notifications.";
        setNotifError(nmsg);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        localStorage.removeItem("role");
        localStorage.removeItem("name");
        localStorage.removeItem("email");
        navigate("/login");
        return;
      }
      setError(err.response?.data?.message || "Failed to load items. Please login again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userId || !token) {
      navigate("/login");
      return;
    }
    loadData();
  }, []);

  useEffect(() => {
    if (!userId || !token) return;
    const id = setInterval(async () => {
      try {
        const notifRes = await api.get("/notifications/my");
        setNotifications(notifRes.data || []);
        setNotifError("");
      } catch {
        /* keep existing list; avoid spamming errors */
      }
    }, 20000);
    return () => clearInterval(id);
  }, [userId, token]);

  const allItems = useMemo(() => [...myItems, ...otherItems], [myItems, otherItems]);
  const totalItems = allItems.length;
  const lostCount = allItems.filter((item) => item.status === "LOST").length;
  const foundCount = allItems.filter((item) => item.status === "FOUND").length;
  const claimedCount = allItems.filter((item) => item.status === "CLAIMED").length;
  const isNotificationRead = (n) => n.read ?? n.isRead;
  const unreadCount = notifications.filter((n) => !isNotificationRead(n)).length;

  const applyFilters = (list) => {
    const q = (filters.q || "").trim().toLowerCase();
    const cat = (filters.category || "").trim().toLowerCase();
    const loc = (filters.location || "").trim().toLowerCase();
    const st = (filters.status || "").trim().toUpperCase();
    return (list || [])
      .filter((i) => (!q ? true : (i.name || "").toLowerCase().includes(q)))
      .filter((i) => (!cat ? true : (i.category || "").toLowerCase().includes(cat)))
      .filter((i) => (!loc ? true : (i.location || "").toLowerCase().includes(loc)))
      .filter((i) => (!st ? true : (i.status || "").toUpperCase() === st));
  };

  const sortedMyItems = useMemo(() => applyFilters(myItems).slice().reverse(), [myItems, filters]);
  const filteredOtherItems = useMemo(() => applyFilters(otherItems), [otherItems, filters]);

  const handleEdit = (item) => {
    navigate("/add-item", { state: { editItem: item } });
  };

  const handleReportFound = (item) => {
    setReportModal({ open: true, item, contactInfo: "", imageFile: null, submitting: false });
  };

  const handleDelete = async (itemId) => {
    try {
      await api.delete(`/items/${itemId}`);
      loadData();
      setDeleteCandidate(null);
    } catch (err) {
      setError(err.response?.data?.message || "Delete failed.");
    }
  };

  const submitReportFound = async () => {
    if (!reportModal.item?.id) return;
    if (!reportModal.imageFile) {
      setError("Please select an image for the found report.");
      return;
    }
    if (!reportModal.contactInfo.trim()) {
      setError("Please enter contact info for the found report.");
      return;
    }
    setError("");
    setReportModal((prev) => ({ ...prev, submitting: true }));
    try {
      const fd = new FormData();
      fd.append("image", reportModal.imageFile);
      fd.append("contactInfo", reportModal.contactInfo);
      await api.post(`/items/${reportModal.item.id}/report-found`, fd, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setReportModal({ open: false, item: null, contactInfo: "", imageFile: null, submitting: false });
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Report failed.");
    } finally {
      setReportModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  const openDeleteModal = (itemId) => {
    setDeleteCandidate(itemId);
  };

  const openGallery = (title, images, startIndex = 0) => {
    setGalleryState({
      open: true,
      title,
      images: (images || []).map((u) => mediaUrl(u)),
      activeIndex: startIndex
    });
  };

  const closeGallery = () => {
    setGalleryState({ open: false, title: "", images: [], activeIndex: 0 });
  };

  const renderStatusBadge = (itemStatus) => (
    <span className={`status-chip status-${(itemStatus || "").toLowerCase()}`}>{itemStatus}</span>
  );

  const markNotificationRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      loadData();
    } catch (e) {
      // ignore
    }
  };

  return (
    <div className="dashboard-page">
      <section className="widget-grid">
        <div className="widget widget-blue">
          <h4>Total Items</h4>
          <p>{totalItems}</p>
        </div>
        <div className="widget widget-red">
          <h4>Lost Items</h4>
          <p>{lostCount}</p>
        </div>
        <div className="widget widget-green">
          <h4>Found Items</h4>
          <p>{foundCount}</p>
        </div>
        <div className="widget widget-amber">
          <h4>Resolved Items</h4>
          <p>{claimedCount}</p>
        </div>
        <div className="widget widget-purple">
          <h4>Unread Alerts</h4>
          <p>{unreadCount}</p>
        </div>
      </section>

      <section className="panel">
        <div className="panel-title-row">
          <h3>My Listed Items</h3>
          <button type="button" onClick={() => navigate("/add-item")}>Add New LOST Item</button>
        </div>
        <div className="filter-row" style={{ marginBottom: 12 }}>
          <input
            placeholder="Search name"
            value={filters.q}
            onChange={(e) => setFilters((p) => ({ ...p, q: e.target.value }))}
          />
          <input
            placeholder="Category"
            value={filters.category}
            onChange={(e) => setFilters((p) => ({ ...p, category: e.target.value }))}
          />
          <input
            placeholder="Location"
            value={filters.location}
            onChange={(e) => setFilters((p) => ({ ...p, location: e.target.value }))}
          />
          <select value={filters.status} onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}>
            <option value="">All Status</option>
            <option value="LOST">LOST</option>
            <option value="FOUND">FOUND</option>
            <option value="CLAIMED">CLAIMED</option>
          </select>
          <button type="button" className="ghost-btn" onClick={() => setFilters({ q: "", category: "", location: "", status: "" })}>
            Reset
          </button>
        </div>
        <div className="item-grid">
          {sortedMyItems.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              canManage={true}
              onEdit={handleEdit}
              onDelete={openDeleteModal}
              onReportFound={handleReportFound}
              onOpenGallery={openGallery}
            />
          ))}
          {sortedMyItems.length === 0 ? <p className="helper-text">No items listed by you yet.</p> : null}
        </div>
        {error ? <p className="error-text">{error}</p> : null}
        {loading ? <p className="helper-text">Loading records...</p> : null}
      </section>

      <section className="panel">
        <div className="panel-title-row">
          <h3>Notifications</h3>
          <span className="helper-text">{unreadCount} unread</span>
        </div>
        {notifError ? <p className="error-text">{notifError}</p> : null}
        <div className="mini-list">
          {notifications.map((n) => (
            <div key={n.id} className={`mini-list-item ${isNotificationRead(n) ? "" : "unread-item"}`}>
              <div>
                <p className="notif-reporter-line">
                  Reported by <strong className="notif-reporter-name">{n.finderName || "Unknown user"}</strong>
                </p>
                <p className="notif-message">
                  <strong>{n.message}</strong>
                </p>
                <p className="helper-text">
                  Their contact (from report): <strong>{n.finderContactInfo || "—"}</strong>
                </p>
                {n.foundImage ? (
                  <button type="button" className="ghost-btn" onClick={() => openGallery("Found proof", [n.foundImage])}>
                    View Image
                  </button>
                ) : null}
              </div>
              {!isNotificationRead(n) ? (
                <button type="button" className="ghost-btn" onClick={() => markNotificationRead(n.id)}>
                  Mark Read
                </button>
              ) : null}
            </div>
          ))}
          {notifications.length === 0 ? <p className="helper-text">No notifications yet.</p> : null}
        </div>
      </section>

      <section className="panel">
        <div className="panel-title-row">
          <h3>Other Users' Items</h3>
          <span className="helper-text">You can only report found items here.</span>
        </div>
        <div className="table-wrap">
          <table className="item-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Category</th>
                <th>Location</th>
                <th>Status</th>
                <th>Owner</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOtherItems.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.name}</td>
                  <td>{item.category}</td>
                  <td>{item.location}</td>
                  <td>{renderStatusBadge(item.status)}</td>
                  <td>{item.createdBy?.name || item.legacyOwner?.name || "-"}</td>
                  <td className="inline-actions">
                    {item.image ? (
                      <button type="button" className="ghost-btn" onClick={() => openGallery(item.name, [item.image])}>
                        Image
                      </button>
                    ) : null}
                    {item.status === "LOST" ? (
                      <button type="button" className="ghost-btn" onClick={() => handleReportFound(item)}>
                        Report Found
                      </button>
                    ) : (
                      <span className="helper-text">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {otherItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="helper-text">No other users' items found.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {deleteCandidate ? (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h3>Confirm Delete</h3>
            <p className="helper-text">This action will permanently remove the selected item report.</p>
            <div className="modal-actions">
              <button type="button" className="ghost-btn" onClick={() => setDeleteCandidate(null)}>
                Cancel
              </button>
              <button type="button" onClick={() => handleDelete(deleteCandidate)}>
                Delete Item
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {reportModal.open ? (
        <div className="modal-backdrop" onClick={() => setReportModal({ open: false, item: null, contactInfo: "", imageFile: null, submitting: false })}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Report Found</h3>
            <p className="helper-text">
              Reporting for <strong>{reportModal.item?.name}</strong>. Upload a proof image and your contact details.
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setReportModal((prev) => ({ ...prev, imageFile: e.target.files?.[0] || null }))}
            />
            <input
              placeholder="Your contact info (phone/email)"
              value={reportModal.contactInfo}
              onChange={(e) => setReportModal((prev) => ({ ...prev, contactInfo: e.target.value }))}
            />
            <div className="modal-actions">
              <button
                type="button"
                className="ghost-btn"
                disabled={reportModal.submitting}
                onClick={() => setReportModal({ open: false, item: null, contactInfo: "", imageFile: null, submitting: false })}
              >
                Cancel
              </button>
              <button type="button" disabled={reportModal.submitting} onClick={submitReportFound}>
                {reportModal.submitting ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {galleryState.open ? (
        <div className="modal-backdrop" onClick={closeGallery}>
          <div className="gallery-modal" onClick={(e) => e.stopPropagation()}>
            <div className="panel-title-row">
              <h3>{galleryState.title} Images</h3>
              <button type="button" className="ghost-btn" onClick={closeGallery}>
                Close
              </button>
            </div>
            <div className="gallery-main">
              <img
                src={galleryState.images[galleryState.activeIndex]}
                alt={`${galleryState.title} preview`}
              />
            </div>
            <div className="gallery-thumbnails">
              {galleryState.images.map((image, index) => (
                <button
                  key={`${galleryState.title}-${index}`}
                  type="button"
                  className={`thumbnail-btn ${galleryState.activeIndex === index ? "thumbnail-active" : ""}`}
                  onClick={() => setGalleryState((prev) => ({ ...prev, activeIndex: index }))}
                >
                  <img src={image} alt={`thumb-${index + 1}`} />
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default Dashboard;
