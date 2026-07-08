// frontend/src/services/apiService.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1';

const client: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
