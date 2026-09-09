import { DOMWrapper, enableAutoUnmount, flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import type { StarfallGameListItemDto } from '@/api/swagger/Starfall/data-contracts';
import Games from '@/modules/games/pages/Games.vue';
import CreateGameModal from '@/modules/games/components/CreateGameModal.vue';
import * as creation from '@/modules/games/useCreateGame';
import { validation } from '@/plugins/validation';
import appRouter from '@/router';
import { mockDialog } from './helpers/mockDialog';

const { getStarfallGames, createStarfallGame } = vi.hoisted(() => ({
  getStarfallGames: vi.fn(),
  createStarfallGame: vi.fn()
}));
vi.mock('@/api/swagger/Starfall/Starfall', () => ({
  useStarfall: () => ({ getStarfallGames, createStarfallGame })
}));

const mountLobby = async () => {
  const router = createRouter({ history: createMemoryHistory(), routes: appRouter.options.routes });
  await router.push('/games');
  return { wrapper: mount(Games, { attachTo: document.body, global: { plugins: [router, validation] } }), router };
};

let nativeDialog: ReturnType<typeof mockDialog>;
beforeEach(() => {
  nativeDialog = mockDialog();
  getStarfallGames.mockReset();
  createStarfallGame.mockReset();
});
enableAutoUnmount((unmount) => {
  afterEach(() => {
    unmount();
    vi.restoreAllMocks();
    nativeDialog.restore();
    document.body.replaceChildren();
  });
});

describe('Game lobby', () => {
  it('shows loading before the response and an empty state after an empty response', async () => {
    let resolveGames!: (games: StarfallGameListItemDto[]) => void;
    const request = new Promise<StarfallGameListItemDto[]>((resolve) => {
      resolveGames = resolve;
    });
    getStarfallGames.mockReturnValue(request);
    const { wrapper } = await mountLobby();

    expect(wrapper.get('[role="status"]').text()).toContain('Loading games');
    expect(wrapper.text()).not.toContain('No games available yet');
    expect(getStarfallGames).toHaveBeenCalledWith({ notStarted: true });
    resolveGames([]);
    await flushPromises();

    expect(wrapper.find('[role="status"]').exists()).toBe(false);
    expect(wrapper.text()).toContain('No games available yet');
    expect(wrapper.find('ul').exists()).toBe(false);
    expect(wrapper.get('button').text()).toContain('Create game');
    wrapper.unmount();
  });

  it('renders returned games and opens the selected game route', async () => {
    getStarfallGames.mockResolvedValue([
      { id: 'game-123456', players: ['Pilot Nova', 'Orion'], createdAt: '2026-09-05T12:30:00Z' },
      { id: 'game-987654', players: [], createdAt: '2026-09-05T13:30:00Z' }
    ] satisfies StarfallGameListItemDto[]);
    const { wrapper, router } = await mountLobby();
    await flushPromises();

    expect(wrapper.findAll('li')).toHaveLength(2);
    expect(wrapper.text()).toContain('Pilot Nova · Orion');
    expect(wrapper.text()).toContain('No players yet');
    expect(wrapper.text()).not.toContain('No games available yet');
    expect(getStarfallGames).toHaveBeenCalledOnce();

    const link = wrapper.get('a[href="/games/game-123456"]');
    await link.trigger('click', { button: 0 });
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('game'));
    expect(router.currentRoute.value.params.gameId).toBe('game-123456');
    wrapper.unmount();
  });

  it('ends loading on failure and allows retrying the request', async () => {
    getStarfallGames.mockRejectedValueOnce(new Error('Network failure')).mockResolvedValueOnce([]);
    const { wrapper } = await mountLobby();
    await flushPromises();

    expect(wrapper.get('[role="alert"]').text()).toContain('We couldn’t load the games');
    expect(wrapper.find('[role="status"]').exists()).toBe(false);
    expect(wrapper.text()).not.toContain('No games available yet');
    const retry = wrapper.findAll('button').find((button) => button.text() === 'Try again');
    expect(retry).toBeDefined();
    await retry!.trigger('click');
    await flushPromises();

    expect(getStarfallGames).toHaveBeenCalledTimes(2);
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
    expect(wrapper.text()).toContain('No games available yet');
    wrapper.unmount();
  });
});

const openCreation = async () => {
  getStarfallGames.mockResolvedValue([]);
  const lobby = await mountLobby();
  await lobby.wrapper.get('button').trigger('click');
  return { ...lobby, dialog: new DOMWrapper(document.body.querySelector('dialog')!) };
};

describe('Game creation', () => {
  it('opens with 50 HP and currently blocks submission because required rejects numbers', async () => {
    const { dialog, router } = await openCreation();
    expect(dialog.element.open).toBe(true);
    expect(dialog.get('input').element.value).toBe('50');
    expect(createStarfallGame).not.toHaveBeenCalled();
    await dialog.get('button[type="submit"]').trigger('click');
    await vi.waitFor(() => expect(dialog.get('[role="alert"]').text()).toBe('Starting hp is required'));
    expect(createStarfallGame).not.toHaveBeenCalled();
    expect(router.currentRoute.value.path).toBe('/games');
    expect(dialog.element.open).toBe(true);
  });

  it.each([
    ['', 'Starting hp is required'],
    ['0', 'Min value is 10'],
    ['-1', 'Min value is 10'],
    ['1', 'Min value is 10'],
    ['9', 'Min value is 10'],
    ['501', 'Max value is 500'],
    ['1.5', 'Min value is 10']
  ])('shows the current validation error for HP %s', async (hp, message) => {
    const { dialog, router } = await openCreation();
    await dialog.get('input').setValue(hp);
    await dialog.get('form').trigger('submit');
    await vi.waitFor(() => expect(dialog.get('[role="alert"]').text()).toBe(message));
    expect(createStarfallGame).not.toHaveBeenCalled();
    expect(router.currentRoute.value.path).toBe('/games');
  });

  // Known issue: numeric values pass min/max but fail the string-only required rule.
  it.each([10, 500, 50.5])('currently rejects numeric HP %s inside the configured range', async (hp) => {
    const { dialog, router } = await openCreation();
    await dialog.get('input').setValue(hp);
    await dialog.get('form').trigger('submit');
    await vi.waitFor(() => expect(dialog.get('[role="alert"]').text()).toBe('Starting hp is required'));
    expect(createStarfallGame).not.toHaveBeenCalled();
    expect(router.currentRoute.value.path).toBe('/games');
  });

  it('navigates to the game ID supplied by the creation event', async () => {
    const { wrapper, router } = await openCreation();
    wrapper.getComponent(CreateGameModal).vm.$emit('created', 'new-game');
    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/games/new-game'));
  });

  it('disables controls and closing during a request and displays the API error', async () => {
    let rejectCreation!: (reason: Error) => void;
    createStarfallGame.mockReturnValueOnce(
      new Promise((_, reject) => {
        rejectCreation = reject;
      })
    );
    // Drive the real request state directly: form submission is blocked by the known required bug.
    const request = creation.useCreateGame();
    vi.spyOn(creation, 'useCreateGame').mockReturnValueOnce(request);
    const { dialog, router } = await openCreation();
    await dialog.get('input').setValue(75);
    const pending = request.createGame({ startingHp: 75 });
    await flushPromises();
    expect(dialog.get('input').attributes('disabled')).toBeDefined();
    expect(dialog.get('button[type="submit"]').attributes('aria-busy')).toBe('true');
    expect(dialog.findAll('button').every((button) => button.attributes('disabled') !== undefined)).toBe(true);
    await dialog.trigger('cancel');
    expect(dialog.element.open).toBe(true);
    await dialog.get('form').trigger('submit');
    expect(createStarfallGame).toHaveBeenCalledOnce();
    rejectCreation(new Error('Network failure'));
    await pending;
    await flushPromises();
    expect(dialog.get('[role="alert"]').text()).toContain('We couldn’t create the game');
    expect(dialog.get('input').element.value).toBe('75');
    expect(dialog.get('input').attributes('disabled')).toBeUndefined();
    expect(router.currentRoute.value.path).toBe('/games');
    expect(dialog.get('button[type="submit"]').attributes('aria-busy')).toBeUndefined();
    await dialog.trigger('cancel');
    expect(document.body.querySelector('dialog')).toBeNull();
  });

  it('cancels without creating a game and resets HP when reopened', async () => {
    const { dialog, wrapper } = await openCreation();
    await dialog.get('input').setValue(100);
    await dialog
      .findAll('button')
      .find((button) => button.text() === 'Cancel')!
      .trigger('click');
    expect(document.body.querySelector('dialog')).toBeNull();
    expect(createStarfallGame).not.toHaveBeenCalled();
    await wrapper.get('button').trigger('click');
    expect(document.body.querySelector('input')?.value).toBe('50');
  });
});
