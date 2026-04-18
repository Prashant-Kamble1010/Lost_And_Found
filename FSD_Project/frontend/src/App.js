import React, { useState } from "react";
import { NavLink, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AddEditItem from "./pages/AddEditItem";

function App() {
  const navigate = useNavigate();
  const rawName = localStorage.getItem("name");
  const userName = rawName && rawName !== "undefined" ? rawName : "Guest";
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("role");
    localStorage.removeItem("name");
    localStorage.removeItem("email");
    setProfileOpen(false);
    navigate("/login");
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-dot">LF</div>
          <div>
            <h1>PCCOE Portal</h1>
            <p>Smart Lost & Found</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/add-item">Add Item</NavLink>
          <NavLink to="/login">Login</NavLink>
          <NavLink to="/register">Register</NavLink>
        </nav>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div>
            <h2>Lost & Found Manager</h2>
            <p>Track, search, and resolve campus item reports</p>
          </div>
          <div className="profile-menu">
            <button
              type="button"
              className="user-badge profile-button"
              onClick={() => setProfileOpen((prev) => !prev)}
            >
              {userName}
            </button>
            {profileOpen ? (
              <div className="profile-dropdown">
                <button type="button" className="ghost-btn" onClick={() => navigate("/dashboard")}>
                  Profile
                </button>
                <button type="button" className="ghost-btn" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            ) : null}
          </div>
        </header>

        <div className="page-wrap">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/add-item" element={<AddEditItem />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default App;
