import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UserRolesEnum } from '@/api/swagger/Auth/data-contracts';
import { ACCESS_TOKEN_KEY, getAuthToken, setAuthToken } from '@/helpers/token-helpers';
import { useAuthStore } from '@/modules/auth/useAuth';
import { AUTH_CHANGE_KEY } from '@/modules/auth/auth-sync';

const { logoutApi, signinApi, signupApi, refreshApi } = vi.hoisted(() => ({
  logoutApi: vi.fn(),
  signinApi: vi.fn(),
  signupApi: vi.fn(),
  refreshApi: vi.fn()
}));
vi.mock('@/api/swagger/Auth/Auth', () => ({
  useAuth: () => ({ logout: logoutApi, signin: signinApi, signup: signupApi, refresh: refreshApi })
}));

beforeEach(() => {
  setActivePinia(createPinia());
  vi.resetAllMocks();
  localStorage.clear();
});
afterEach(() => localStorage.clear());

const signedInStore = () => {
  const store = useAuthStore();
  store.user = { id: 1, email: 'pilot@example.com', username: 'Pilot', role: UserRolesEnum.User };
  setAuthToken('test-access-token');
  localStorage.setItem('theme', 'dark');
  return store;
};

describe('Auth store logout', () => {
  it('clears the user immediately and removes only the access token after the request', async () => {
    let resolveLogout!: () => void;
    logoutApi.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveLogout = resolve;
      })
    );
    const store = signedInStore();

    const pending = store.logout();
    expect(store.user).toBeNull();
    expect(logoutApi).toHaveBeenCalledOnce();
    expect(getAuthToken()).toBe('test-access-token');
    expect(localStorage.getItem(AUTH_CHANGE_KEY)).toBeNull();

    resolveLogout();
    await pending;
    expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBeNull();
    expect(getAuthToken()).toBe('');
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(localStorage.getItem(AUTH_CHANGE_KEY)).toBeTruthy();
  });

  it('removes the access token even when the logout request fails', async () => {
    const error = new Error('Network failure');
    logoutApi.mockRejectedValue(error);
    const store = signedInStore();

    await expect(store.logout()).rejects.toBe(error);
    expect(logoutApi).toHaveBeenCalledOnce();
    expect(store.user).toBeNull();
    expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBeNull();
    expect(getAuthToken()).toBe('');
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(localStorage.getItem(AUTH_CHANGE_KEY)).toBeTruthy();
  });

  it('can log out when no access token is stored', async () => {
    logoutApi.mockResolvedValue({ message: 'success' });
    const store = useAuthStore();

    await expect(store.logout()).resolves.toBeUndefined();
    expect(logoutApi).toHaveBeenCalledOnce();
    expect(store.user).toBeNull();
    expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(AUTH_CHANGE_KEY)).toBeTruthy();
  });
});

describe('Auth change notifications', () => {
  const credentials = { email: 'pilot@example.com', password: 'password', username: 'Pilot' };
  const response = {
    accessToken: 'new-access-token',
    user: { id: 2, email: credentials.email, username: credentials.username, role: UserRolesEnum.User }
  };

  it.each(['signin', 'signup'] as const)('notifies after successful %s, including repeated login', async (method) => {
    const api = method === 'signin' ? signinApi : signupApi;
    let resolveAuth!: (value: typeof response) => void;
    api.mockReturnValueOnce(
      new Promise<typeof response>((resolve) => {
        resolveAuth = resolve;
      })
    );
    api.mockResolvedValueOnce(response);
    const store = signedInStore();
    const pending = store[method](credentials);
    expect(localStorage.getItem(AUTH_CHANGE_KEY)).toBeNull();

    resolveAuth(response);
    await expect(pending).resolves.toEqual({ success: true, error: null });
    const firstNotice = localStorage.getItem(AUTH_CHANGE_KEY);
    expect(firstNotice).toBeTruthy();
    expect(getAuthToken()).toBe(response.accessToken);
    expect(store.user).toEqual(response.user);

    await store[method](credentials);
    expect(localStorage.getItem(AUTH_CHANGE_KEY)).not.toBe(firstNotice);
  });

  it.each(['signin', 'signup'] as const)('does not notify after failed %s', async (method) => {
    const api = method === 'signin' ? signinApi : signupApi;
    const error = new Error('Unauthorized');
    api.mockRejectedValue(error);
    const store = signedInStore();

    await expect(store[method](credentials)).resolves.toEqual({ success: false, error });
    expect(localStorage.getItem(AUTH_CHANGE_KEY)).toBeNull();
    expect(getAuthToken()).toBe('test-access-token');
    expect(store.user?.id).toBe(1);
  });

  it('does not broadcast session restoration or direct token rotation', async () => {
    refreshApi.mockResolvedValue(response);
    const store = useAuthStore();
    await store.refreshAuth();
    expect(getAuthToken()).toBe(response.accessToken);
    expect(store.user).toEqual(response.user);
    expect(localStorage.getItem(AUTH_CHANGE_KEY)).toBeNull();

    setAuthToken('rotated-token');
    expect(localStorage.getItem(AUTH_CHANGE_KEY)).toBeNull();
  });
});
