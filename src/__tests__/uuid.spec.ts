import { afterEach, describe, expect, it, vi } from 'vitest';
import { createUuid } from '@/helpers/uuid';

afterEach(() => vi.unstubAllGlobals());

describe('UUID compatibility', () => {
  it('uses the native generator when available', () => {
    const id = '01234567-89ab-4cde-8f01-23456789abcd';
    const randomUUID = vi.fn(() => id);
    const getRandomValues = vi.fn();
    vi.stubGlobal('crypto', { randomUUID, getRandomValues });
    expect(createUuid()).toBe(id);
    expect(randomUUID).toHaveBeenCalledOnce();
    expect(getRandomValues).not.toHaveBeenCalled();
  });

  it.each([
    [0, '00000000-0000-4000-8000-000000000000'],
    [255, 'ffffffff-ffff-4fff-bfff-ffffffffffff']
  ])('creates a UUID v4 from random bytes filled with %i without randomUUID', (fill, expected) => {
    const getRandomValues = vi.fn((bytes: Uint8Array) => bytes.fill(Number(fill)));
    vi.stubGlobal('crypto', { getRandomValues });
    expect(createUuid()).toBe(expected);
    expect(getRandomValues).toHaveBeenCalledOnce();
    expect(getRandomValues.mock.calls[0]![0]).toHaveLength(16);
  });
});
