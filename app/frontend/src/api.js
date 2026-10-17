import axios from "axios";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "./constants";

const apiUrl = import.meta.env.VITE_API_URL || "/choreo-apis/awbo/backend/rest-api-be2/v1.0";

const api = axios.create({
  baseURL: apiUrl,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(ACCESS_TOKEN) || sessionStorage.getItem(ACCESS_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle expired access token
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      const refreshToken =  localStorage.getItem(REFRESH_TOKEN) || sessionStorage.getItem(REFRESH_TOKEN);

      if (refreshToken) {
        try {
          // Send refresh token request
          const res = await axios.post(
            `${apiUrl}/token/refresh/`,
            { refresh: refreshToken }
          );

          // Save new access token
          const newAccessToken = res.data.access;
          
           if (localStorage.getItem(REFRESH_TOKEN)) {
            localStorage.setItem(ACCESS_TOKEN, newAccessToken);
          } else {
            sessionStorage.setItem(ACCESS_TOKEN, newAccessToken);
          }

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
          
        } catch (refreshError) {
          
          
          localStorage.clear();
          sessionStorage.clear();
          window.location.href = "/";
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
