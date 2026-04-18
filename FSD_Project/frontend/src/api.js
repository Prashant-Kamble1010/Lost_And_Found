import axios from "axios";

const api = axios.create({
  baseURL: "https://lost-and-found-1-bt2p.onrender.com/api/items"
});

/** Turn stored paths like "/uploads/..." into absolute URLs for <img src> on port 3000 */
export function mediaUrl(path) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const base = (api.defaults.baseURL || "").replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
