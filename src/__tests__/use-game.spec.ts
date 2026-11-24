import { realtimeMock } from './helpers/mock-game-realtime';
vi.mock('@/modules/games/game-realtime', () => import('./helpers/mock-game-realtime'));
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
  realtimeMock.autoReady = true;
  realtimeMock.callbacks = null;
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
  api.getStarfallLobby.mockResolvedValue(makeLobby());
  api.getStarfallGame.mockResolvedValue(makeGame());
  api.executeStarfallCommand.mockResolvedValue(makeGame({ version: 2 }));
});
afterEach(() => {
  cleanups.splice(0).forEach((clear) => clear());
  vi.restoreAllMocks();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('game realtime and command transport', () => {
  it('loads and connects even when the browser reports no network', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    const { state } = setup(false);
    expect(api.getStarfallLobby).not.toHaveBeenCalled();
    await state.init();
    expect(realtimeMock.connect).toHaveBeenCalledOnce();
    expect(state.game.value?.id).toBe('game-1');
  });
  it('loads once and applies pushed snapshots without polling or replacing equal versions', async () => {
    const { state } = setup();
    await flushPromises();
    expect(state.me.value?.username).toBe('Alice');
    const original = state.game.value;
    realtimeMock.callbacks!.onState(makeGame());
    expect(state.game.value).toBe(original);
    realtimeMock.callbacks!.onState(makeGame({ version: 3 }));
    realtimeMock.callbacks!.onState(makeGame({ version: 2 }));
    realtimeMock.callbacks!.onState(makeGame({ id: 'other-game', version: 100 }));
    expect(state.game.value?.version).toBe(3);
    await vi.advanceTimersByTimeAsync(60000);
    expect(api.getStarfallGame).toHaveBeenCalledTimes(1);
  });
  it('opens the room on retry after the initial load failed and reuses it on subsequent reads', async () => {
    api.getStarfallLobby.mockRejectedValueOnce(apiFailure(500));
    const { state } = setup(false);
    await state.init();
    expect(realtimeMock.connect).not.toHaveBeenCalled();
    await state.refresh();
    expect(state.canAct.value).toBe(true);
    await state.refresh();
    expect(realtimeMock.connect).toHaveBeenCalledOnce();
  });
  it('requires a socket snapshot before enabling actions', async () => {
    realtimeMock.autoReady = false;
    const { state } = setup();
    await flushPromises();
    expect(state.canAct.value).toBe(false);
    realtimeMock.callbacks!.onState(makeGame({ version: 2 }));
    realtimeMock.callbacks!.onConnection(true);
    expect(state.canAct.value).toBe(true);
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
    expect(realtimeMock.connect).not.toHaveBeenCalled();
    await state.join();
    expect(realtimeMock.connect).toHaveBeenCalledOnce();
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
    expect(realtimeMock.connect).toHaveBeenCalledOnce();
  });
  it.each(['response', 'error'])('ignores a cancelled GET %s while a newer read is pending', async (completion) => {
    const { state } = setup();
    await flushPromises();
    const stale = deferred<GameView>();
    const current = deferred<GameView>();
    api.getStarfallGame.mockReturnValueOnce(stale.promise).mockReturnValueOnce(current.promise);
    const staleRefresh = state.refresh();
    const staleSignal = api.getStarfallGame.mock.calls[1]![1].signal;
    await state.act({ type: 'end_turn', payload: {} });
    expect(staleSignal.aborted).toBe(true);
    const currentRefresh = state.refresh();
    const currentSignal = api.getStarfallGame.mock.calls[2]![1].signal;
    if (completion === 'response') stale.resolve(makeGame({ version: 100 }));
    else stale.reject(apiFailure(403));
    await staleRefresh;
    expect(state.game.value?.version).toBe(2);
    expect(state.isRefreshing.value).toBe(true);
    expect(currentSignal.aborted).toBe(false);
    current.resolve(makeGame({ version: 2 }));
    await currentRefresh;
    expect(state.game.value?.version).toBe(2);
  });
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
    expect(realtimeMock.connect).toHaveBeenCalledOnce();
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
  it('keeps the original retry envelope even after a pushed snapshot', async () => {
    const { state } = setup();
    await flushPromises();
    api.executeStarfallCommand.mockRejectedValueOnce(apiFailure(500));
    await state.act({ type: 'end_turn', payload: {} });
    await flushPromises();
    const original = api.executeStarfallCommand.mock.calls[0]![1];
    realtimeMock.callbacks!.onState(makeGame({ version: 5 }));
    expect(state.canAct.value).toBe(false);
    await state.retryCommand();
    expect(api.executeStarfallCommand.mock.calls[1]![1]).toEqual(original);
    expect(state.uncertainCommand.value).toBeNull();
    expect(state.game.value?.version).toBe(5);
  });
  it('preserves the board and disables actions until the reconnect snapshot', async () => {
    const { state } = setup();
    await flushPromises();
    realtimeMock.autoReady = false;
    realtimeMock.callbacks!.onConnection(false);
    expect(state.game.value?.version).toBe(1);
    expect(state.canAct.value).toBe(false);
    await state.refresh();
    expect(state.canAct.value).toBe(false);
    await vi.advanceTimersByTimeAsync(60000);
    expect(api.getStarfallGame).toHaveBeenCalledTimes(2);
    realtimeMock.callbacks!.onState(makeGame({ version: 4 }));
    realtimeMock.callbacks!.onConnection(true);
    expect(state.game.value?.version).toBe(4);
    expect(state.canAct.value).toBe(true);
  });
  it('keeps the active socket in a hidden tab across browser network events', async () => {
    const { state } = setup();
    await flushPromises();
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
    realtimeMock.callbacks!.onState(makeGame({ version: 2 }));
    expect(state.game.value?.version).toBe(2);
    window.dispatchEvent(new Event('offline'));
    expect(state.canAct.value).toBe(true);
    await vi.advanceTimersByTimeAsync(10000);
    window.dispatchEvent(new Event('online'));
    expect(realtimeMock.connect).toHaveBeenCalledOnce();
    expect(api.getStarfallGame).toHaveBeenCalledTimes(1);
    expect(state.canAct.value).toBe(true);
  });
  it.each(['response', 'error'])('does not revive transport after a late POST %s', async (completion) => {
    const { state } = setup();
    await flushPromises();
    const late = deferred<GameView>();
    api.executeStarfallCommand.mockReturnValueOnce(late.promise);
    const sending = state.act({ type: 'end_turn', payload: {} });
    state.clear();
    if (completion === 'response') late.resolve(makeGame({ version: 10 }));
    else late.reject(apiFailure(500));
    await sending;
    expect(state.game.value?.version).toBe(1);
    expect(realtimeMock.clear).toHaveBeenCalledOnce();
    expect(realtimeMock.connect).toHaveBeenCalledTimes(1);
    expect(api.getStarfallGame).toHaveBeenCalledTimes(1);
  });
  it('does not roll back a newer push when a command response arrives late', async () => {
    const { state } = setup();
    await flushPromises();
    const late = deferred<GameView>();
    api.executeStarfallCommand.mockReturnValueOnce(late.promise);
    const sending = state.act({ type: 'end_turn', payload: {} });
    realtimeMock.callbacks!.onState(makeGame({ version: 3 }));
    late.resolve(makeGame({ version: 2 }));
    await sending;
    expect(state.game.value?.version).toBe(3);
  });
  it('stops the transport after clear', async () => {
    const { state } = setup();
    await flushPromises();
    const calls = api.getStarfallGame.mock.calls.length;
    state.clear();
    await vi.advanceTimersByTimeAsync(10000);
    expect(api.getStarfallGame).toHaveBeenCalledTimes(calls);
  });
  it('clear aborts the active read and ignores late results', async () => {
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
    await vi.advanceTimersByTimeAsync(10000);
    expect(state.game.value?.id).toBe('game-1');
    expect(state.game.value?.version).toBe(1);
    expect(state.error.value).toBe('');
    expect(api.getStarfallGame).toHaveBeenCalledTimes(2);
    expect(api.getStarfallLobby).toHaveBeenCalledTimes(1);
  });
  it('does not poll a finished game', async () => {
    api.getStarfallGame.mockResolvedValue(makeGame({ status: 'finished' as GameView['status'], winnerId: '1' }));
    const { state } = setup();
    await flushPromises();
    await vi.advanceTimersByTimeAsync(10000);
    expect(api.getStarfallGame).toHaveBeenCalledTimes(1);
    expect(state.canAct.value).toBe(false);
  });
});
