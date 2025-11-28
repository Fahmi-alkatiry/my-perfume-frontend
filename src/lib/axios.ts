// frontend/src/lib/axios.ts
import axios from "axios";
import Cookies from "js-cookie";

// 1. Buat instance axios
// https://api.myperfumee.my.id/
// http://localhost:5000
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,

}

);

// 2. Buat Interceptor (Middleware untuk Axios)
axiosInstance.interceptors.request.use(
  (config) => {
    // 3. Ambil token dari cookie
    const token = Cookies.get("token");

    // 4. Jika token ada, tambahkan ke header Authorization
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;