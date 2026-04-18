import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";

function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    try {
      const response = await api.post("/auth/login", form);
      if (!response.data?.token) {
        throw new Error("Missing token from server.");
      }
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("userId", String(response.data.userId || ""));
      localStorage.setItem("role", response.data.role || "USER");
      localStorage.setItem("name", response.data.name || "");
      localStorage.setItem("email", response.data.email || "");
      setMessage("Login successful");
      navigate("/dashboard");
    } catch (error) {
      setMessage(error.response?.data?.message || "Login failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h2>Welcome back</h2>
        <p>Login to manage your lost and found reports.</p>

        <form onSubmit={handleSubmit}>
          <input name="email" placeholder="Email" onChange={handleChange} required />
          <input name="password" type="password" placeholder="Password" onChange={handleChange} required />
          <button type="submit" disabled={isLoading}>
            {isLoading ? "Signing In..." : "Login"}
          </button>
        </form>

        <p className="helper-text">New user? <Link to="/register">Create account</Link></p>
        {message ? <p className={message.includes("successful") ? "success-text" : "error-text"}>{message}</p> : null}
      </div>
      <div className="auth-banner">
        <h3>Campus Lost & Found Hub</h3>
        <p>Quick reporting, matching, and item recovery in one dashboard.</p>
      </div>
    </div>
  );
}

export default Login;
