import { io } from 'socket.io-client';
import { refreshAccessToken } from '@/api/api';
import { getAuthToken } from '@/helpers/token-helpers';
import type { GameView } from './game-types';

interface RealtimeCallbacks {
  onState: (game: GameView) => void;
  onConnection: (ready: boolean) => void;
  onError: (status?: number) => void;
}

export function createGameRealtime(gameId: string, callbacks: RealtimeCallbacks) {
  const origin = new URL(import.meta.env.VITE_API_BASE_URL || '/').origin;
  const socket = io(`${origin}/starfall`, {
    autoConnect: false,
    transports: ['websocket'],
    withCredentials: true,
    auth: (done) => done({ token: getAuthToken(), gameId })
  });
  let disposed = false;
  let stopped = true;
  let refreshing = false;
  let refreshed = false;
  let retryTimer: ReturnType<typeof setTimeout> | undefined;
  let retryDelay = 1000;

  const reconnect = () => {
    if (disposed || stopped || refreshing || retryTimer) return;
    retryTimer = setTimeout(() => {
      retryTimer = undefined;
      if (!disposed && !stopped) socket.connect();
    }, retryDelay);
    retryDelay = Math.min(retryDelay * 2, 10000);
  };

  const fail = async (status?: number) => {
    if (disposed || stopped) return;
    callbacks.onConnection(false);
    if (status === 401 && !refreshed) {
      if (refreshing) return;
      refreshing = true;
      refreshed = true;
      socket.disconnect();
      try {
        await refreshAccessToken();
        if (!disposed && !stopped) socket.connect();
      } catch {
        if (!disposed && !stopped) {
          stopped = true;
          callbacks.onError(401);
        }
      } finally {
        refreshing = false;
      }
      return;
    }
    callbacks.onError(status);
    if (status === 400 || status === 401 || status === 403 || status === 404) {
      stopped = true;
      socket.disconnect();
    } else if (!socket.active) {
      reconnect();
    }
  };

  socket.on('game:state', (game: GameView) => {
    if (disposed || stopped || game.id !== gameId) return;
    refreshed = false;
    retryDelay = 1000;
    callbacks.onState(game);
    callbacks.onConnection(true);
  });
  socket.on('disconnect', (reason) => {
    if (disposed || stopped) return;
    callbacks.onConnection(false);
    if (reason === 'io server disconnect') reconnect();
  });
  socket.on('connect_error', (error: Error & { data?: { status?: number } }) => void fail(error.data?.status));
  socket.on('game:error', ({ status }: { status: number }) => void fail(status));

  return {
    connect() {
      if (disposed || !stopped) return;
      stopped = false;
      refreshed = false;
      clearTimeout(retryTimer);
      retryTimer = undefined;
      if (!refreshing) socket.connect();
    },
    clear() {
      disposed = true;
      clearTimeout(retryTimer);
      socket.removeAllListeners();
      socket.disconnect();
    }
  };
}
