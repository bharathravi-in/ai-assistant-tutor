/**
 * Enhanced API Client with offline support
 */
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import offlineQueueService from './offlineQueueService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface RequestQueueable extends AxiosRequestConfig {
  queueOnFailure?: boolean; // Whether to queue this request if it fails
}

/**
 * Enhanced axios instance with offline queue support
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle offline errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as RequestQueueable;

    // Check if request should be queued on failure
    const shouldQueue =
      originalRequest.queueOnFailure !== false && // Default to true unless explicitly disabled
      (error.message === 'Network Error' || !navigator.onLine) &&
      ['POST', 'PUT', 'PATCH', 'DELETE'].includes(originalRequest.method?.toUpperCase() || '');

    if (shouldQueue) {
      console.log('🔄 Queueing failed request for later sync');
      
      try {
        await offlineQueueService.queueRequest(
          originalRequest.url || '',
          originalRequest.method || 'GET',
          originalRequest.data,
          originalRequest.headers as Record<string, string>
        );

        // Return a special response indicating the request was queued
        return Promise.resolve({
          data: {
            queued: true,
            message: 'Request queued for sync when online',
          },
          status: 202, // Accepted
          statusText: 'Queued',
          headers: {},
          config: originalRequest,
        } as AxiosResponse);
      } catch (queueError) {
        console.error('Failed to queue request:', queueError);
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Helper to make requests that should be queued on failure
 */
export const makeQueueableRequest = async <T = any>(
  config: AxiosRequestConfig
): Promise<AxiosResponse<T>> => {
  return api.request<T>({ ...config, queueOnFailure: true } as RequestQueueable);
};

/**
 * Helper to make requests that should NOT be queued (e.g., GET requests)
 */
export const makeNonQueueableRequest = async <T = any>(
  config: AxiosRequestConfig
): Promise<AxiosResponse<T>> => {
  return api.request<T>({ ...config, queueOnFailure: false } as RequestQueueable);
};

export default api;
