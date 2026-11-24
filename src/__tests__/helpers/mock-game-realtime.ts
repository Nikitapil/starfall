import { vi } from 'vitest';
import type { createGameRealtime as CreateGameRealtime } from '@/modules/games/game-realtime';

type Callbacks = Parameters<typeof CreateGameRealtime>[1];
export const realtimeMock = {
  callbacks: null as Callbacks | null,
  autoReady: true,
  connect: vi.fn(),
  clear: vi.fn()
};

export function createGameRealtime(gameId: string, callbacks: Callbacks) {
  realtimeMock.callbacks = callbacks;
  return {
    connect() {
      realtimeMock.connect(gameId);
      if (realtimeMock.autoReady) callbacks.onConnection(true);
    },
    clear: realtimeMock.clear
  };
}
