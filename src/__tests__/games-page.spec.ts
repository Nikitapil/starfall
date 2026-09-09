import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import type { StarfallGameListItemDto } from '@/api/swagger/Starfall/data-contracts';
import Games from '@/modules/games/pages/Games.vue';
import appRouter from '@/router';

const { getStarfallGames } = vi.hoisted(() => ({ getStarfallGames: vi.fn() }));
vi.mock('@/api/swagger/Starfall/Starfall', () => ({
  useStarfall: () => ({ getStarfallGames })
}));

const mountLobby = async () => {
  const router = createRouter({ history: createMemoryHistory(), routes: appRouter.options.routes });
  await router.push('/games');
  return { wrapper: mount(Games, { global: { plugins: [router] } }), router };
};

beforeEach(() => {
  getStarfallGames.mockReset();
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
    await wrapper.get('button').trigger('click');
    expect(router.currentRoute.value.path).toBe('/games');
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
