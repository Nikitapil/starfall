import axios, { AxiosError, type AxiosAdapter, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import $api from '@/api/api';
import { getAuthToken, setAuthToken } from '@/helpers/token-helpers';
import { AUTH_CHANGE_KEY } from '@/modules/auth/auth-sync';
import { useAuthStore } from '@/modules/auth/useAuth';
import { UserRolesEnum } from '@/api/swagger/Auth/data-contracts';

const apiAdapter = vi.fn<AxiosAdapter>();
const refreshAdapter = vi.fn<AxiosAdapter>();
const originalApiAdapter = $api.defaults.adapter;
const originalAxiosAdapter = axios.defaults.adapter;

const response = (config: InternalAxiosRequestConfig, data: unknown = {}, status = 200): AxiosResponse => ({
  config,
  data,
  status,
  statusText: String(status),
  headers: {}
});

const unauthorized = (config: InternalAxiosRequestConfig) =>
  new AxiosError('Unauthorized', AxiosError.ERR_BAD_REQUEST, config, undefined, response(config, {}, 401));

const deferred = <T>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
};

beforeEach(() => {
  apiAdapter.mockReset();
  refreshAdapter.mockReset();
  $api.defaults.adapter = apiAdapter;
  axios.defaults.adapter = refreshAdapter;
  vi.stubEnv('VITE_API_BASE_URL', 'https://example.test/');
  localStorage.clear();
  setAuthToken('expired-token');
  setActivePinia(createPinia());
});

afterEach(() => {
  $api.defaults.adapter = originalApiAdapter;
  axios.defaults.adapter = originalAxiosAdapter;
  vi.unstubAllEnvs();
  localStorage.clear();
});

describe('Coordinated refresh', () => {
  it.each([
    ['https://example.test', 'https://example.test/api/auth/refresh'],
    ['https://example.test/', 'https://example.test/api/auth/refresh'],
    ['https://example.test///', 'https://example.test/api/auth/refresh'],
    ['https://example.test/backend', 'https://example.test/backend/api/auth/refresh'],
    ['https://example.test/backend/', 'https://example.test/backend/api/auth/refresh']
  ])('shares one normalized refresh for base URL %s and retries waiting requests', async (baseURL, refreshURL) => {
    vi.stubEnv('VITE_API_BASE_URL', baseURL);
    const refresh = deferred<AxiosResponse>();
    refreshAdapter.mockReturnValue(refresh.promise);
    apiAdapter.mockImplementation(async (config) => {
      if (config.headers.Authorization === 'Bearer expired-token') throw unauthorized(config);
      return response(config, { url: config.url });
    });

    const requests = Promise.all([
      $api.get('/games', { params: { notStarted: true } }),
      $api.post('/games', { startingHp: 50 }),
      $api.get('/profile')
    ]);
    await vi.waitFor(() => expect(apiAdapter).toHaveBeenCalledTimes(3));
    await vi.waitFor(() => expect(refreshAdapter).toHaveBeenCalledOnce());
    const refreshConfig = refreshAdapter.mock.calls[0]![0];
    expect(axios.getUri(refreshConfig)).toBe(refreshURL);
    expect(refreshConfig.withCredentials).toBe(true);
    expect(getAuthToken()).toBe('expired-token');

    refresh.resolve(response(refreshConfig, { accessToken: 'new-token' }));
    const results = await requests;
    expect(results.map((result) => result.data)).toEqual([{ url: '/games' }, { url: '/games' }, { url: '/profile' }]);
    expect(refreshAdapter).toHaveBeenCalledOnce();
    expect(apiAdapter).toHaveBeenCalledTimes(6);
    const retries = apiAdapter.mock.calls.slice(3).map(([config]) => config);
    expect(retries.every((config) => config.headers.Authorization === 'Bearer new-token')).toBe(true);
    expect(retries[0]?.params).toEqual({ notStarted: true });
    expect(retries[1]?.method).toBe('post');
    expect(retries[1]?.data).toBe(JSON.stringify({ startingHp: 50 }));
    expect(getAuthToken()).toBe('new-token');
    expect(localStorage.getItem(AUTH_CHANGE_KEY)).toBeNull();
  });

  it('passes refresh failure to all waiters without clearing auth and allows a later refresh', async () => {
    const refresh = deferred<AxiosResponse>();
    refreshAdapter.mockReturnValueOnce(refresh.promise);
    apiAdapter.mockImplementation(async (config) => {
      if (config.headers.Authorization === 'Bearer expired-token') throw unauthorized(config);
      return response(config);
    });
    const store = useAuthStore();
    const user = { id: 1, email: 'pilot@example.com', username: 'Pilot', role: UserRolesEnum.User };
    store.user = user;

    const requests = Promise.allSettled([$api.get('/games'), $api.get('/profile')]);
    await vi.waitFor(() => expect(apiAdapter).toHaveBeenCalledTimes(2));
    await vi.waitFor(() => expect(refreshAdapter).toHaveBeenCalledOnce());
    const error = new Error('Refresh failed');
    refresh.reject(error);
    expect(await requests).toEqual([
      { status: 'rejected', reason: error },
      { status: 'rejected', reason: error }
    ]);
    expect(apiAdapter).toHaveBeenCalledTimes(2);
    expect(getAuthToken()).toBe('expired-token');
    expect(store.user).toEqual(user);
    expect(localStorage.getItem(AUTH_CHANGE_KEY)).toBeNull();

    refreshAdapter.mockImplementationOnce(async (config) => response(config, { accessToken: 'recovered-token' }));
    await expect($api.get('/games')).resolves.toHaveProperty('status', 200);
    expect(refreshAdapter).toHaveBeenCalledTimes(2);
    expect(getAuthToken()).toBe('recovered-token');
  });

  it('starts a new refresh cycle after a previous successful refresh', async () => {
    let acceptedToken = 'first-token';
    apiAdapter.mockImplementation(async (config) => {
      if (config.headers.Authorization !== `Bearer ${acceptedToken}`) throw unauthorized(config);
      return response(config);
    });
    refreshAdapter.mockImplementation(async (config) => response(config, { accessToken: acceptedToken }));

    await $api.get('/games');
    acceptedToken = 'second-token';
    await $api.get('/profile');
    expect(refreshAdapter).toHaveBeenCalledTimes(2);
    expect(getAuthToken()).toBe('second-token');
  });

  it('does not refresh again when a retried request still returns 401', async () => {
    apiAdapter.mockImplementation(async (config) => {
      throw unauthorized(config);
    });
    refreshAdapter.mockImplementation(async (config) => response(config, { accessToken: 'new-token' }));

    await expect($api.get('/games')).rejects.toMatchObject({ response: { status: 401 } });
    expect(apiAdapter).toHaveBeenCalledTimes(2);
    expect(refreshAdapter).toHaveBeenCalledOnce();
  });

  it('does not recursively refresh a failed refresh endpoint request', async () => {
    apiAdapter.mockImplementation(async (config) => {
      throw unauthorized(config);
    });
    await expect($api.get('/api/auth/refresh')).rejects.toMatchObject({ response: { status: 401 } });
    expect(apiAdapter).toHaveBeenCalledOnce();
    expect(refreshAdapter).not.toHaveBeenCalled();
  });
});

describe('Transport failures', () => {
  it('preserves a network error without trying to refresh', async () => {
    const error = new AxiosError('Network Error', AxiosError.ERR_NETWORK);
    apiAdapter.mockRejectedValueOnce(error);
    await expect($api.get('/api/starfall/games/game')).rejects.toBe(error);
    expect(refreshAdapter).not.toHaveBeenCalled();
  });
  it('preserves request cancellation without trying to refresh', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect($api.get('/api/starfall/games/game', { signal: controller.signal })).rejects.toMatchObject({
      code: 'ERR_CANCELED'
    });
    expect(refreshAdapter).not.toHaveBeenCalled();
  });
});
