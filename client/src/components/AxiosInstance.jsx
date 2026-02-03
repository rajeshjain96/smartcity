// src/axiosInstance.js
import axios from "axios";
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL + '/api',
  withCredentials: true,
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check for 401 Unauthorized (session expired)
    if (error.response && error.response.status === 401) {
      // Dispatch custom event to notify app about session expiration
      const sessionExpiredEvent = new CustomEvent('sessionExpired', {
        detail: { message: 'Your session has expired. Please login again.' }
      });
      window.dispatchEvent(sessionExpiredEvent);
    }
    // Check if it's a TokenExpiredError
    if (error.response?.data?.name === "TokenExpiredError") {
      // Attach custom message to the error
      error.customMessage = "Session expired, refresh the page.";
      // Also dispatch session expired event
      const sessionExpiredEvent = new CustomEvent('sessionExpired', {
        detail: { message: 'Your session has expired. Please login again.' }
      });
      window.dispatchEvent(sessionExpiredEvent);
    }
    return Promise.reject(error); // forward the error
  }
);

export default axiosInstance;
