import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

let backendDisabled = false;

// ──────────────────────────────────────────────
// Create typed Axios instance
// ──────────────────────────────────────────────
const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 400, // 400ms max timeout so local demo fallback triggers fast
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Send httpOnly cookies automatically
});

// ──────────────────────────────────────────────
// Request interceptor — attach Bearer token from localStorage fallback
// ──────────────────────────────────────────────
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Fast-fail if backend is known to be offline to provide instant demo load times (0ms delay)
    if (backendDisabled && !process.env.NEXT_PUBLIC_API_BASE_URL) {
      return Promise.reject(new Error('Backend server offline — instant mock mode active'));
    }
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('cmyp_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ──────────────────────────────────────────────
// Response interceptor — centralized error handling
// ──────────────────────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; detail?: string }>) => {
    if (error.response) {
      const { status } = error.response;

      if (status === 401) {
        // Token expired / invalid — clear storage and redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('cmyp_token');
          localStorage.removeItem('cmyp_user');
          window.location.href = '/login';
        }
      }

      // Normalize error message
      const message =
        error.response.data?.message ||
        error.response.data?.detail ||
        `Request failed with status ${status}`;

      return Promise.reject(new Error(message));
    }

    if (error.request || error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') {
      // Backend server is not running on localhost:8000 — remember this to make all subsequent page loads instant!
      backendDisabled = true;
      return Promise.reject(new Error('Network error — please check your connection.'));
    }

    return Promise.reject(new Error(error.message || 'An unexpected error occurred.'));
  }
);

export default apiClient;

// ──────────────────────────────────────────────
// Generic typed request helpers
// ──────────────────────────────────────────────
export async function get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const res = await apiClient.get<T>(url, { params });
  return res.data;
}

export async function post<T>(url: string, data?: unknown): Promise<T> {
  const res = await apiClient.post<T>(url, data);
  return res.data;
}

export async function put<T>(url: string, data?: unknown): Promise<T> {
  const res = await apiClient.put<T>(url, data);
  return res.data;
}

export async function patch<T>(url: string, data?: unknown): Promise<T> {
  const res = await apiClient.patch<T>(url, data);
  return res.data;
}

export async function del<T>(url: string): Promise<T> {
  const res = await apiClient.delete<T>(url);
  return res.data;
}

export async function postFormData<T>(url: string, data: FormData): Promise<T> {
  const res = await apiClient.post<T>(url, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}
