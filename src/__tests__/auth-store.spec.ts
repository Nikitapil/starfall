import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UserRolesEnum } from '@/api/swagger/Auth/data-contracts';
import { ACCESS_TOKEN_KEY, getAuthToken, setAuthToken } from '@/helpers/token-helpers';
import { useAuthStore } from '@/modules/auth/useAuth';

const { logoutApi } = vi.hoisted(() => ({ logoutApi: vi.fn() }));
vi.mock('@/api/swagger/Auth/Auth', () => ({
  useAuth: () => ({ logout: logoutApi })
}));

beforeEach(() => {
  setActivePinia(createPinia());
  logoutApi.mockReset();
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

    resolveLogout();
    await pending;
    expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBeNull();
    expect(getAuthToken()).toBe('');
    expect(localStorage.getItem('theme')).toBe('dark');
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
  });

  it('can log out when no access token is stored', async () => {
    logoutApi.mockResolvedValue({ message: 'success' });
    const store = useAuthStore();

    await expect(store.logout()).resolves.toBeUndefined();
    expect(logoutApi).toHaveBeenCalledOnce();
    expect(store.user).toBeNull();
    expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBeNull();
  });
});
