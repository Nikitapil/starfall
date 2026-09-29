import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { effectScope, ref } from 'vue';
import { flushPromises } from '@vue/test-utils';
import { useGame } from '@/modules/games/useGame';
import type { GameAction, GameView } from '@/modules/games/game-types';
import { apiFailure, deferred, makeGame, makeLobby } from './helpers/game-fixtures';
const api = vi.hoisted(() => ({
  getStarfallGame: vi.fn(),
  getStarfallLobby: vi.fn(),
  joinStarfallGame: vi.fn(),
  executeStarfallCommand: vi.fn()
}));
vi.mock('@/api/swagger/Starfall/Starfall', () => ({ useStarfall: () => api }));
const cleanups: (() => void)[] = [];
function setup(autoInit = true) {
  const scope = effectScope();
  const state = scope.run(() => useGame(ref('game-1'), ref('1')))!;
  cleanups.push(() => {
    state.clear();
    scope.stop();
  });
  if (autoInit) void state.init();
  return { state };
}
beforeEach(() => {
  vi.useFakeTimers();
  vi.resetAllMocks();
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
  Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
  api.getStarfallLobby.mockResolvedValue(makeLobby());
  api.getStarfallGame.mockResolvedValue(makeGame());
  api.executeStarfallCommand.mockResolvedValue(makeGame({ version: 2 }));
});
afterEach(() => {
  cleanups.splice(0).forEach((clear) => clear());
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('game polling and command transport', () => {
  it('starts loading and browser subscriptions only after init', async () => {
    const { state } = setup(false);
    window.dispatchEvent(new Event('offline'));
    expect(state.error.value).toBe('');
    window.dispatchEvent(new Event('online'));
    await vi.advanceTimersByTimeAsync(10000);
    expect(api.getStarfallLobby).not.toHaveBeenCalled();
    expect(api.getStarfallGame).not.toHaveBeenCalled();
    await state.init();
    expect(api.getStarfallLobby).toHaveBeenCalledTimes(1);
    expect(state.game.value?.id).toBe('game-1');
    window.dispatchEvent(new Event('offline'));
    expect(state.error.value).toContain('offline');
  });
  it('loads private state and polls without overlapping reads', async () => {
    const { state } = setup();
    await flushPromises();
    expect(state.me.value?.username).toBe('Alice');
    const slow = deferred<GameView>();
    api.getStarfallGame.mockReturnValueOnce(slow.promise);
    await vi.advanceTimersByTimeAsync(2000);
    expect(api.getStarfallGame).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(10000);
    expect(api.getStarfallGame).toHaveBeenCalledTimes(2);
    slow.resolve(makeGame({ version: 2 }));
    await flushPromises();
    await vi.advanceTimersByTimeAsync(2000);
    expect(api.getStarfallGame).toHaveBeenCalledTimes(3);
    expect(state.game.value?.version).toBe(2);
  });
  it('joins from public lobby metadata and applies the automatic start response', async () => {
    api.getStarfallLobby.mockResolvedValue(
      makeLobby({
        status: 'waiting' as ReturnType<typeof makeLobby>['status'],
        version: 0,
        players: [{ id: '2', username: 'Bob' }]
      })
    );
    api.joinStarfallGame.mockResolvedValue(makeGame());
    const { state } = setup();
    await flushPromises();
    expect(api.getStarfallGame).not.toHaveBeenCalled();
    expect(state.canJoin.value).toBe(true);
    await state.join();
    expect(api.joinStarfallGame).toHaveBeenCalledWith(
      { gameId: 'game-1' },
      { expectedVersion: 0 },
      expect.objectContaining({ timeout: 10000 })
    );
    expect(state.game.value?.status).toBe('active');
  });
  it('does not overwrite command state with an older in-flight GET', async () => {
    const { state } = setup();
    await flushPromises();
    const stale = deferred<GameView>();
    api.getStarfallGame.mockReturnValueOnce(stale.promise);
    void state.refresh();
    const request = api.getStarfallGame.mock.calls[api.getStarfallGame.mock.calls.length - 1]![1];
    await state.act({ type: 'play_card', payload: { cardId: 'scout-1' } });
    expect(request.signal.aborted).toBe(true);
    stale.resolve(makeGame());
    await flushPromises();
    expect(state.game.value?.version).toBe(2);
  });
  it.each(['response', 'error'])(
    'ignores an old GET %s without clearing a newer read or restarting stopped polling',
    async (completion) => {
      const { state } = setup();
      await flushPromises();
      const stale = deferred<GameView>();
      const current = deferred<GameView>();
      api.getStarfallGame.mockReturnValueOnce(stale.promise).mockReturnValueOnce(current.promise);
      const staleRefresh = state.refresh();
      const staleSignal = api.getStarfallGame.mock.calls[1]![1].signal;
      window.dispatchEvent(new Event('offline'));
      expect(staleSignal.aborted).toBe(true);
      window.dispatchEvent(new Event('online'));
      const currentSignal = api.getStarfallGame.mock.calls[2]![1].signal;
      const errorBefore = state.error.value;
      if (completion === 'response') stale.resolve(makeGame({ version: 100 }));
      else stale.reject(apiFailure(403));
      await staleRefresh;
      expect(state.game.value?.version).toBe(1);
      expect(state.error.value).toBe(errorBefore);
      expect(state.isRefreshing.value).toBe(true);
      expect(currentSignal.aborted).toBe(false);
      await state.refresh();
      expect(api.getStarfallGame).toHaveBeenCalledTimes(3);
      window.dispatchEvent(new Event('offline'));
      expect(currentSignal.aborted).toBe(true);
      current.resolve(makeGame({ version: 2 }));
      await flushPromises();
      await vi.advanceTimersByTimeAsync(10000);
      expect(state.game.value?.version).toBe(1);
      expect(api.getStarfallGame).toHaveBeenCalledTimes(3);
    }
  );
  it.each<GameAction>([
    { type: 'play_card', payload: { cardId: 'scout-1' } },
    { type: 'buy_card', payload: { cardId: 'trade-1' } },
    { type: 'use_ability', payload: { cardId: 'base', abilityId: 'primary:0' } },
    { type: 'attack_base', payload: { cardId: 'enemy-base' } },
    { type: 'attack_player', payload: { amount: 3 } },
    { type: 'end_turn', payload: {} }
  ])('sends typed $type with a version and an idempotency key', async (action) => {
    const { state } = setup();
    await flushPromises();
    await state.act(action);
    expect(api.executeStarfallCommand).toHaveBeenCalledWith(
      { gameId: 'game-1' },
      { ...action, expectedVersion: 1, commandId: expect.any(String) },
      expect.objectContaining({ timeout: 10000 })
    );
  });
  it('blocks duplicate sends and regular commands during a pending choice', async () => {
    const slow = deferred<GameView>();
    api.executeStarfallCommand.mockReturnValueOnce(slow.promise);
    const { state } = setup();
    await flushPromises();
    void state.act({ type: 'end_turn', payload: {} });
    void state.act({ type: 'end_turn', payload: {} });
    expect(api.executeStarfallCommand).toHaveBeenCalledTimes(1);
    slow.resolve(
      makeGame({
        version: 2,
        pendingAction: { type: 'choose_effect', playerId: '1', options: [] } as GameView['pendingAction']
      })
    );
    await flushPromises();
    void state.act({ type: 'end_turn', payload: {} });
    expect(api.executeStarfallCommand).toHaveBeenCalledTimes(1);
    await state.act({ type: 'resolve_pending', payload: { optionIndex: 0 } });
    expect(api.executeStarfallCommand.mock.calls[1]![1].type).toBe('resolve_pending');
  });
  it('refreshes on a version conflict without replaying the action', async () => {
    const { state } = setup();
    await flushPromises();
    api.executeStarfallCommand.mockRejectedValueOnce(apiFailure(409));
    api.getStarfallGame.mockResolvedValue(makeGame({ version: 3 }));
    await state.act({ type: 'end_turn', payload: {} });
    await flushPromises();
    expect(state.game.value?.version).toBe(3);
    expect(state.commandError.value).toContain('game changed');
    expect(api.executeStarfallCommand).toHaveBeenCalledTimes(1);
    expect(state.uncertainCommand.value).toBeNull();
  });
  it('retries an ambiguous POST only explicitly with the exact original envelope', async () => {
    vi.stubGlobal('crypto', { getRandomValues: globalThis.crypto.getRandomValues.bind(globalThis.crypto) });
    const { state } = setup();
    await flushPromises();
    api.executeStarfallCommand.mockRejectedValueOnce(apiFailure());
    await state.act({ type: 'attack_player', payload: { amount: 3 } });
    await flushPromises();
    expect(state.canAct.value).toBe(false);
    await vi.advanceTimersByTimeAsync(5000);
    expect(api.executeStarfallCommand).toHaveBeenCalledTimes(1);
    const original = api.executeStarfallCommand.mock.calls[0]![1];
    expect(original.commandId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    await state.retryCommand();
    expect(api.executeStarfallCommand.mock.calls[1]![1]).toEqual(original);
    expect(state.uncertainCommand.value).toBeNull();
  });
  it('preserves the board on connection loss and retries every two seconds until recovery', async () => {
    const { state } = setup();
    await flushPromises();
    api.getStarfallGame.mockRejectedValueOnce(apiFailure()).mockRejectedValueOnce(apiFailure());
    await vi.advanceTimersByTimeAsync(2000);
    expect(state.game.value?.version).toBe(1);
    expect(state.canAct.value).toBe(false);
    await vi.advanceTimersByTimeAsync(1999);
    expect(api.getStarfallGame).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(1);
    expect(api.getStarfallGame).toHaveBeenCalledTimes(3);
    expect(state.canAct.value).toBe(false);
    await vi.advanceTimersByTimeAsync(1999);
    expect(api.getStarfallGame).toHaveBeenCalledTimes(3);
    await vi.advanceTimersByTimeAsync(1);
    expect(api.getStarfallGame).toHaveBeenCalledTimes(4);
    expect(state.canAct.value).toBe(true);
  });
  it('keeps polling when hidden, pauses offline and refreshes on reconnect', async () => {
    const { state } = setup();
    await flushPromises();
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(state.canAct.value).toBe(true);
    await vi.advanceTimersByTimeAsync(2000);
    expect(api.getStarfallGame).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(2000);
    expect(api.getStarfallGame).toHaveBeenCalledTimes(3);
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
    document.dispatchEvent(new Event('visibilitychange'));
    await flushPromises();
    expect(api.getStarfallGame).toHaveBeenCalledTimes(3);
    window.dispatchEvent(new Event('offline'));
    expect(state.canAct.value).toBe(false);
    await vi.advanceTimersByTimeAsync(10000);
    expect(api.getStarfallGame).toHaveBeenCalledTimes(3);
    window.dispatchEvent(new Event('online'));
    await flushPromises();
    expect(api.getStarfallGame).toHaveBeenCalledTimes(4);
    expect(state.canAct.value).toBe(true);
  });
  it('stops polling after clear', async () => {
    const { state } = setup();
    await flushPromises();
    const calls = api.getStarfallGame.mock.calls.length;
    state.clear();
    await vi.advanceTimersByTimeAsync(10000);
    window.dispatchEvent(new Event('online'));
    expect(api.getStarfallGame).toHaveBeenCalledTimes(calls);
  });
  it('clear aborts the active read, ignores late results and stops reacting to browser events', async () => {
    const { state } = setup();
    await flushPromises();
    const late = deferred<GameView>();
    api.getStarfallGame.mockReturnValueOnce(late.promise);
    const refresh = state.refresh();
    const request = api.getStarfallGame.mock.calls[1]![1];
    state.clear();
    state.clear();
    expect(request.signal.aborted).toBe(true);
    late.resolve(makeGame({ version: 100 }));
    await refresh;
    window.dispatchEvent(new Event('offline'));
    window.dispatchEvent(new Event('online'));
    await vi.advanceTimersByTimeAsync(10000);
    expect(state.game.value?.id).toBe('game-1');
    expect(state.game.value?.version).toBe(1);
    expect(state.error.value).toBe('');
    expect(api.getStarfallGame).toHaveBeenCalledTimes(2);
    expect(api.getStarfallLobby).toHaveBeenCalledTimes(1);
  });
  it('stops polling a finished game', async () => {
    api.getStarfallGame.mockResolvedValue(makeGame({ status: 'finished' as GameView['status'], winnerId: '1' }));
    const { state } = setup();
    await flushPromises();
    await vi.advanceTimersByTimeAsync(10000);
    expect(api.getStarfallGame).toHaveBeenCalledTimes(1);
    expect(state.canAct.value).toBe(false);
  });
});
