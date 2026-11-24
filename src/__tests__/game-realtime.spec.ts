import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { createGameRealtime } from '@/modules/games/game-realtime';
import { deferred, makeGame } from './helpers/game-fixtures';

const transport = vi.hoisted(() => {
  const listeners = new Map<string, (...args: never[]) => void>();
  const socket = {
    active: false,
    connect: vi.fn(),
    disconnect: vi.fn(),
    removeAllListeners: vi.fn(),
    on: vi.fn((event: string, callback: (...args: never[]) => void) => listeners.set(event, callback))
  };
  return { listeners, socket, io: vi.fn(() => socket), refresh: vi.fn(), token: 'initial' };
});
vi.mock('socket.io-client', () => ({ io: transport.io }));
vi.mock('@/api/api', () => ({ refreshAccessToken: transport.refresh }));
vi.mock('@/helpers/token-helpers', () => ({ getAuthToken: () => transport.token }));

const receive = (event: string, ...args: unknown[]) => transport.listeners.get(event)?.(...(args as never[]));
let client: ReturnType<typeof createGameRealtime>;
const callbacks = { onState: vi.fn(), onConnection: vi.fn(), onError: vi.fn() };
beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  transport.listeners.clear();
  transport.socket.active = false;
  transport.refresh.mockResolvedValue(undefined);
  transport.token = 'initial';
  client = createGameRealtime('game-1', callbacks);
  client.connect();
  transport.socket.connect.mockClear();
});
afterEach(() => {
  client.clear();
  vi.useRealTimers();
});

describe('Socket.IO game transport', () => {
  it('uses WebSocket only and reads the latest token for every handshake', () => {
    const options = (
      transport.io.mock.calls[0] as unknown as [
        string,
        {
          transports: string[];
          autoConnect: boolean;
          auth: (done: (auth: unknown) => void) => void;
        }
      ]
    )[1];
    expect(options.transports).toEqual(['websocket']);
    expect(options.autoConnect).toBe(false);
    const done = vi.fn();
    options.auth(done);
    expect(done).toHaveBeenLastCalledWith({ token: 'initial', gameId: 'game-1' });
    transport.token = 'renewed';
    options.auth(done);
    expect(done).toHaveBeenLastCalledWith({ token: 'renewed', gameId: 'game-1' });
  });

  it('becomes ready only on a snapshot for the selected game', () => {
    client.connect();
    receive('connect');
    receive('game:state', makeGame({ id: 'foreign' }));
    expect(callbacks.onConnection).not.toHaveBeenCalled();
    receive('game:state', makeGame());
    expect(callbacks.onState).toHaveBeenCalledWith(makeGame());
    expect(callbacks.onConnection).toHaveBeenLastCalledWith(true);
    receive('disconnect', 'transport close');
    expect(callbacks.onConnection).toHaveBeenLastCalledWith(false);
  });

  it('refreshes an expired JWT once and reconnects without replaying commands', async () => {
    receive('game:error', { status: 401 });
    await flushPromises();
    expect(transport.refresh).toHaveBeenCalledOnce();
    expect(transport.socket.disconnect).toHaveBeenCalledOnce();
    expect(transport.socket.connect).toHaveBeenCalledOnce();
    receive('connect_error', { data: { status: 401 } });
    await flushPromises();
    expect(transport.refresh).toHaveBeenCalledOnce();
    expect(callbacks.onError).toHaveBeenCalledWith(401);
    await vi.advanceTimersByTimeAsync(30000);
    expect(transport.socket.connect).toHaveBeenCalledOnce();
  });

  it('does not reconnect after clear while token refresh is pending', async () => {
    const refresh = deferred<void>();
    transport.refresh.mockReturnValueOnce(refresh.promise);
    receive('connect_error', { data: { status: 401 } });
    client.clear();
    refresh.resolve();
    await flushPromises();
    expect(transport.socket.connect).not.toHaveBeenCalled();
    expect(transport.socket.removeAllListeners).toHaveBeenCalledOnce();
  });

  it('reports refresh failure without reconnecting indefinitely', async () => {
    transport.refresh.mockRejectedValueOnce(new Error('Expired session'));
    receive('connect_error', { data: { status: 401 } });
    await flushPromises();
    expect(callbacks.onError).toHaveBeenCalledWith(401);
    await vi.advanceTimersByTimeAsync(30000);
    expect(transport.socket.connect).not.toHaveBeenCalled();
  });

  it.each([400, 403, 404])('does not retry a rejected room (%s)', async (status) => {
    receive('connect_error', { data: { status } });
    await vi.advanceTimersByTimeAsync(30000);
    expect(callbacks.onError).toHaveBeenCalledWith(status);
    expect(transport.socket.connect).not.toHaveBeenCalled();
  });

  it('retries a server disconnection and stops retrying on cleanup', async () => {
    receive('disconnect', 'io server disconnect');
    client.connect();
    expect(transport.socket.connect).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1000);
    expect(transport.socket.connect).toHaveBeenCalledOnce();
    receive('connect_error', { data: { status: 503 } });
    client.clear();
    await vi.advanceTimersByTimeAsync(30000);
    expect(transport.socket.connect).toHaveBeenCalledOnce();
  });
});
