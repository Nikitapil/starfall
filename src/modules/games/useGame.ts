import { computed, ref, toValue, type MaybeRefOrGetter, type Ref } from 'vue';
import axios from 'axios';
import { i18n } from '@/plugins/i18n';
import { createUuid } from '@/helpers/uuid';
import { useStarfall } from '@/api/swagger/Starfall/Starfall';
import type { StarfallLobbyDto } from '@/api/swagger/Starfall/data-contracts';
import type { GameAction, GameCommand, GameView } from './game-types';
import { createGameRealtime } from './game-realtime';

const REQUEST_TIMEOUT = 10000;

export function useGame(gameId: MaybeRefOrGetter<string>, playerId: Ref<string>) {
  const api = useStarfall();
  const game = ref<GameView | null>(null);
  const lobby = ref<StarfallLobbyDto | null>(null);
  const isLoading = ref(true);
  const isRefreshing = ref(false);
  const isSending = ref(false);
  const isSynced = ref(false);
  const errorKey = ref('');
  const commandErrorKey = ref('');
  const serverCommandError = ref('');
  const error = computed(() => (errorKey.value ? i18n.global.t(errorKey.value) : ''));
  const commandError = computed(
    () => serverCommandError.value || (commandErrorKey.value ? i18n.global.t(commandErrorKey.value) : '')
  );
  const terminal = ref(false);
  const uncertainCommand = ref<GameCommand | null>(null);
  const me = computed(() => game.value?.players.find((p) => p.id === playerId.value));
  const opponent = computed(() => game.value?.players.find((p) => p.id !== playerId.value));
  const isMyTurn = computed(() => game.value?.status === 'active' && game.value.currentPlayerId === playerId.value);
  const canSend = computed(() => isSynced.value && !terminal.value && !isSending.value && !uncertainCommand.value);
  const canAct = computed(() => canSend.value && isMyTurn.value && !game.value?.pendingAction);
  const canJoin = computed(
    () => canSend.value && !game.value && lobby.value?.status === 'waiting' && lobby.value.players.length < 2
  );
  let realtime: ReturnType<typeof createGameRealtime> | undefined;
  let socketReady = false;
  let readController: AbortController | undefined;

  const stopRead = () => {
    readController?.abort();
    readController = undefined;
    isRefreshing.value = false;
  };
  const applyGame = (next: GameView) => {
    if (next.id !== toValue(gameId) || (game.value && next.version < game.value.version)) {
      return;
    }
    if (!game.value || next.version !== game.value.version) {
      game.value = next;
    }
  };
  const connectRealtime = () => {
    if (socketReady || terminal.value || !game.value) return;
    if (!realtime) {
      realtime = createGameRealtime(toValue(gameId), {
        onState: applyGame,
        onConnection: (ready) => {
          socketReady = ready;
          isSynced.value = ready;
          errorKey.value = ready ? '' : 'game.errors.connection';
        },
        onError: (status) => {
          isSynced.value = false;
          terminal.value = status === 400 || status === 401 || status === 403 || status === 404;
          errorKey.value =
            status === 401
              ? 'game.errors.session'
              : status === 403
                ? 'game.errors.forbidden'
                : status === 404
                  ? 'game.errors.notFound'
                  : 'game.errors.connection';
        }
      });
    }
    realtime.connect();
  };
  const failureMessage = (cause: unknown) => {
    const status = axios.isAxiosError(cause) ? cause.response?.status : undefined;
    if (status === 404) return 'game.errors.notFound';
    if (status === 403) return 'game.errors.forbidden';
    if (status === 401) return 'game.errors.session';
    return 'game.errors.connection';
  };

  async function refresh() {
    if (isSending.value || isRefreshing.value || terminal.value) {
      return;
    }
    const id = toValue(gameId);
    const user = toValue(playerId);
    if (!id || !user) {
      return;
    }
    isRefreshing.value = true;
    const controller = new AbortController();
    readController = controller;
    const params = { signal: controller.signal, timeout: REQUEST_TIMEOUT };
    try {
      if (!game.value) {
        const details = await api.getStarfallLobby({ gameId: id }, params);
        if (readController !== controller) {
          return;
        }
        lobby.value = details;
        if (details.players.some((p) => p.id === user)) {
          const next = await api.getStarfallGame({ gameId: id }, params);
          if (readController !== controller) {
            return;
          }
          applyGame(next);
        }
      } else {
        const next = await api.getStarfallGame({ gameId: id }, params);
        if (readController !== controller) return;
        applyGame(next);
      }
      errorKey.value = '';
      isSynced.value = !game.value || socketReady;
      return true;
    } catch (cause) {
      if (readController !== controller || axios.isCancel(cause)) {
        return;
      }
      isSynced.value = false;
      errorKey.value = failureMessage(cause);
      const status = axios.isAxiosError(cause) ? cause.response?.status : undefined;
      terminal.value = status === 401 || status === 403 || status === 404;
    } finally {
      if (readController === controller) {
        isLoading.value = false;
        isRefreshing.value = false;
        readController = undefined;
      }
    }
  }

  async function loadAndConnect() {
    if (await refresh()) connectRealtime();
  }

  async function mutate(command: GameCommand | null) {
    if (isSending.value || terminal.value) {
      return;
    }
    const id = toValue(gameId);
    const version = lobby.value?.version;
    stopRead();
    isSending.value = true;
    commandErrorKey.value = '';
    serverCommandError.value = '';
    const params = { timeout: REQUEST_TIMEOUT };
    let shouldRefresh = false;
    try {
      const next = command
        ? await api.executeStarfallCommand({ gameId: id }, command, params)
        : await api.joinStarfallGame({ gameId: id }, { expectedVersion: version! }, params);
      applyGame(next);
      uncertainCommand.value = null;
      isSynced.value = socketReady;
      if (socketReady) errorKey.value = '';
      if (!command) connectRealtime();
    } catch (cause) {
      shouldRefresh = true;
      const status = axios.isAxiosError(cause) ? cause.response?.status : undefined;
      isSynced.value = false;
      if (status === 409) {
        uncertainCommand.value = null;
        commandErrorKey.value = 'game.errors.changed';
      } else if (status === 400) {
        uncertainCommand.value = null;
        const message = axios.isAxiosError<{ message?: unknown }>(cause) ? cause.response?.data?.message : undefined;
        serverCommandError.value = typeof message === 'string' ? message : '';
        commandErrorKey.value = serverCommandError.value ? '' : 'game.errors.unavailable';
      } else if (status === 401 || status === 403 || status === 404) {
        terminal.value = true;
        errorKey.value = failureMessage(cause);
      } else {
        uncertainCommand.value = command;
        commandErrorKey.value = command ? 'game.errors.uncertain' : 'game.errors.joining';
      }
    } finally {
      isSending.value = false;
      if (shouldRefresh) {
        if (command) void refresh();
        else void loadAndConnect();
      }
    }
  }

  const act = (action: GameAction) => {
    if (!canSend.value || !game.value || game.value.status !== 'active') return;
    const resolves = action.type === 'resolve_pending' || action.type === 'cancel_pending';
    if (resolves ? game.value.pendingAction?.playerId !== toValue(playerId) : !canAct.value) return;
    return mutate({ ...action, commandId: createUuid(), expectedVersion: game.value.version } as GameCommand);
  };
  const join = () => {
    if (canJoin.value) return mutate(null);
  };
  const retryCommand = () => {
    if (uncertainCommand.value) return mutate(uncertainCommand.value);
  };
  const retry = () => {
    terminal.value = false;
    return loadAndConnect();
  };
  const clear = () => {
    stopRead();
    realtime?.clear();
  };
  return {
    game,
    lobby,
    me,
    opponent,
    isMyTurn,
    canAct,
    canSend,
    canJoin,
    isLoading,
    isRefreshing,
    isSending,
    isSynced,
    error,
    commandError,
    uncertainCommand,
    refresh: retry,
    join,
    act,
    retryCommand,
    init: loadAndConnect,
    clear
  };
}
