import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json"
  }
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If 401 Unauthorized, token might be invalid or expired
    if (error.response && error.response.status === 401) {
      const isAuthCheck = error.config.url.includes("/auth/me");
      if (!isAuthCheck) {
        // Only clear if active action failed
        // localStorage.removeItem("token");
      }
    }
    return Promise.reject(error);
  }
);

export default api;