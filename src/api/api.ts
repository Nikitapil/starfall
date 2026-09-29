import { getAuthToken, setAuthToken } from '@/helpers/token-helpers';
import axios from 'axios';
import type { AuthResponseDto } from './swagger/Auth/data-contracts';

const $api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/',
  withCredentials: true
});

let refreshPromise: Promise<void> | null = null;

const refreshAccessToken = () => {
  if (!refreshPromise) {
    refreshPromise = axios
      .get<AuthResponseDto>('/api/auth/refresh', {
        baseURL: import.meta.env.VITE_API_BASE_URL,
        withCredentials: true
      })
      .then((response) => {
        setAuthToken(response.data.accessToken);
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

$api.interceptors.request.use((config) => {
  config.headers.Authorization = `Bearer ${getAuthToken()}`;
  return config;
});

$api.interceptors.response.use(
  (config) => {
    return config;
  },
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      error.config &&
      !error.config._isRetry &&
      error.config.url !== '/api/auth/refresh'
    ) {
      originalRequest._isRetry = true;
      await refreshAccessToken();
      return $api.request(originalRequest);
    }
    throw error;
  }
);

export default $api;
