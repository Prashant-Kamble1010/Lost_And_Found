import React, { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    try {
      const response = await api.post("/auth/register", form);
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("userId", response.data.userId);
      localStorage.setItem("role", response.data.role);
      localStorage.setItem("name", response.data.name);
      localStorage.setItem("email", response.data.email);
      setMessage("Registration successful.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Registration failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h2>Create account</h2>
        <p>Register as user/admin for the lost and found system.</p>
        <form onSubmit={handleSubmit}>
          <input name="name" placeholder="Name" onChange={handleChange} required />
          <input name="email" placeholder="Email" onChange={handleChange} required />
          <input name="password" type="password" placeholder="Password" onChange={handleChange} required />
          <button type="submit" disabled={isLoading}>
            {isLoading ? "Creating..." : "Register"}
          </button>
        </form>
        <p className="helper-text">Already registered? <Link to="/login">Login</Link></p>
        {message ? <p className={message.includes("successful") ? "success-text" : "error-text"}>{message}</p> : null}
      </div>
      <div className="auth-banner">
        <h3>Smart Portal Features</h3>
        <p>Dashboard analytics, quick search, and status tracking for every item.</p>
      </div>
    </div>
  );
}

export default Register;
