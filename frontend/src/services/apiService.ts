// frontend/src/services/apiService.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1';

const client: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const detail = error.response.data?.detail;
      const status = error.response.status;
      let msg: string;
      if (detail && typeof detail === 'string') {
        msg = detail;
      } else if (status === 500) {
        msg = 'Server error. Check backend logs for details.';
      } else if (status === 400) {
        msg = 'Invalid request. Please try again.';
      } else if (status === 404) {
        msg = 'Resource not found.';
      } else {
        msg = error.response.statusText || `Request failed (status ${status})`;
      }
      return Promise.reject(new Error(msg));
    }
    if (error.request) {
      const msg = error.code === 'ECONNREFUSED'
        ? 'FastAPI server is not running. Start it with: python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000'
        : error.code === 'ECONNABORTED'
        ? 'Request timed out. The server may be overloaded.'
        : 'Network error. Please check your connection.';
      return Promise.reject(new Error(msg));
    }
    return Promise.reject(error);
  }
);

export const apiService = {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return client.get<T>(url, config);
  },
  post<T>(url: string, data?: unknown): Promise<AxiosResponse<T>> {
    return client.post<T>(url, data);
  },
  put<T>(url: string, data?: unknown): Promise<AxiosResponse<T>> {
    return client.put<T>(url, data);
  },
  patch<T>(url: string, data?: unknown): Promise<AxiosResponse<T>> {
    return client.patch<T>(url, data);
  },
  delete<T>(url: string): Promise<AxiosResponse<T>> {
    return client.delete<T>(url);
  },
};
