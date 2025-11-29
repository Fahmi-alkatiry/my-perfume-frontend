// frontend/src/lib/axios.ts
import axios from "axios";
import Cookies from "js-cookie";

// 1. Buat instance axios
// https://api.myperfumee.my.id/
// http://localhost:5000

const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Buat instance axios
const axiosInstance = axios.create({
  baseURL: `${baseURL}/api`, // jika backend pakai /api
});

// Interceptor untuk auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = Cookies.get("token");

    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;
