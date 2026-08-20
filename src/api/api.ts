import { getAuthToken, setAuthToken } from '@/helpers/token-helpers';
import axios from 'axios';

const $api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true
});

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
    if (error.response.status === 401 && error.config && !error.config._isRetry) {
      try {
        originalRequest._isRetry = true;
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/auth/refresh`, {
          withCredentials: true
        });
        setAuthToken(response.data.accessToken);
        return await $api.request(originalRequest);
      } catch (e) {
        throw e;
      }
    }
    throw error;
  }
);

export default $api;
