import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,   // ← sends the httpOnly refreshToken cookie automatically
});

// ─────────────────────────────────────────────
//  Request interceptor — attach access token
// ─────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mc_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─────────────────────────────────────────────
//  Response interceptor — silent token refresh
// ─────────────────────────────────────────────

let isRefreshing = false;           // prevent multiple simultaneous refresh calls
let failedQueue = [];               // queue requests while refresh is in-flight

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  // ─── Success pass-through ───────────────────
  (response) => response,

  // ─── Error handler ──────────────────────────
  async (error) => {
    const originalRequest = error.config;

    // Only attempt refresh on 401 with TOKEN_EXPIRED code, not on /refresh itself
    const isTokenExpired =
      error.response?.status === 401 &&
      error.response?.data?.code === 'TOKEN_EXPIRED' &&
      !originalRequest._retried &&
      !originalRequest.url.includes('/auth/refresh');

    if (!isTokenExpired) {
      // For any other 401 (bad credentials, no token, etc.) redirect to login
      if (
        error.response?.status === 401 &&
        !originalRequest.url.includes('/auth/login') &&
        !originalRequest.url.includes('/auth/register')
      ) {
        localStorage.removeItem('mc_access_token');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    // Mark this request so we don't retry it more than once
    originalRequest._retried = true;

    if (isRefreshing) {
      // Queue this request while another refresh is in progress
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      }).catch((err) => Promise.reject(err));
    }

    isRefreshing = true;

    try {
      // Call the refresh endpoint — the httpOnly cookie is sent automatically
      const res = await axios.post(
        `${BASE_URL}/auth/refresh`,
        {},
        { withCredentials: true }
      );

      const newAccessToken = res.data.accessToken;
      localStorage.setItem('mc_access_token', newAccessToken);

      // Update the Authorization header for the failed request
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

      // Resolve all queued requests with the new token
      processQueue(null, newAccessToken);

      // Retry the original request
      return api(originalRequest);
    } catch (refreshError) {
      // Refresh token is invalid/expired — force logout
      processQueue(refreshError, null);
      localStorage.removeItem('mc_access_token');
      window.location.href = '/login';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
