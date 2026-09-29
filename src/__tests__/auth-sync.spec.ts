import { afterEach, describe, expect, it, vi } from 'vitest';
import { AUTH_CHANGE_KEY, notifyAuthChange, subscribeToAuthChanges } from '@/modules/auth/auth-sync';
import { ACCESS_TOKEN_KEY } from '@/helpers/token-helpers';

let unsubscribe: (() => void) | undefined;
afterEach(() => {
  unsubscribe?.();
  unsubscribe = undefined;
  localStorage.clear();
  vi.unstubAllGlobals();
});

describe('Auth synchronization between tabs', () => {
  it('notifies the receiver of a change from another tab', () => {
    const reload = vi.fn();
    unsubscribe = subscribeToAuthChanges(reload);
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: AUTH_CHANGE_KEY,
        newValue: 'other-tab-change',
        storageArea: localStorage
      })
    );
    expect(reload).toHaveBeenCalledOnce();
  });

  it('publishes unique notices without notifying the originating tab', () => {
    vi.stubGlobal('crypto', { getRandomValues: globalThis.crypto.getRandomValues.bind(globalThis.crypto) });
    const reload = vi.fn();
    unsubscribe = subscribeToAuthChanges(reload);
    notifyAuthChange();
    const first = localStorage.getItem(AUTH_CHANGE_KEY);
    expect(first).toBeTruthy();
    notifyAuthChange();
    expect(localStorage.getItem(AUTH_CHANGE_KEY)).not.toBe(first);
    expect(reload).not.toHaveBeenCalled();
  });

  it.each([
    { key: ACCESS_TOKEN_KEY, newValue: 'rotated-token' },
    { key: 'theme', newValue: 'dark' },
    { key: null, newValue: null },
    { key: AUTH_CHANGE_KEY, newValue: null }
  ])('ignores unrelated storage changes: $key / $newValue', (change) => {
    const reload = vi.fn();
    unsubscribe = subscribeToAuthChanges(reload);
    window.dispatchEvent(new StorageEvent('storage', { ...change, storageArea: localStorage }));
    expect(reload).not.toHaveBeenCalled();
  });

  it('ignores changes to sessionStorage', () => {
    const reload = vi.fn();
    unsubscribe = subscribeToAuthChanges(reload);
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: AUTH_CHANGE_KEY,
        newValue: 'change',
        storageArea: sessionStorage
      })
    );
    expect(reload).not.toHaveBeenCalled();
  });

  it('removes the listener when unsubscribed', () => {
    const reload = vi.fn();
    unsubscribe = subscribeToAuthChanges(reload);
    unsubscribe();
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: AUTH_CHANGE_KEY,
        newValue: 'change',
        storageArea: localStorage
      })
    );
    expect(reload).not.toHaveBeenCalled();
  });
});
