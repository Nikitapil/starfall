import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DOMWrapper, enableAutoUnmount, flushPromises, mount } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import Game from '@/modules/games/pages/Game.vue';
import { validation } from '@/plugins/validation';
import type { GameCard, GameView } from '@/modules/games/game-types';
import { deferred, makeCard, makeGame, makeLobby } from './helpers/game-fixtures';
import { mockDialog } from './helpers/mockDialog';
const api = vi.hoisted(() => ({
  getStarfallGame: vi.fn(),
  getStarfallLobby: vi.fn(),
  joinStarfallGame: vi.fn(),
  executeStarfallCommand: vi.fn()
}));
vi.mock('@/api/swagger/Starfall/Starfall', () => ({ useStarfall: () => api }));
vi.mock('@/modules/auth/useAuth', () => ({ useAuthStore: () => ({ user: { id: 1, username: 'Alice' } }) }));
let nativeDialog: ReturnType<typeof mockDialog>;
beforeEach(() => {
  vi.resetAllMocks();
  nativeDialog = mockDialog();
  Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
  api.getStarfallLobby.mockResolvedValue(makeLobby());
  api.getStarfallGame.mockResolvedValue(makeGame());
  api.executeStarfallCommand.mockResolvedValue(makeGame({ version: 2 }));
});
enableAutoUnmount((unmount) =>
  afterEach(() => {
    unmount();
    nativeDialog.restore();
    document.body.replaceChildren();
  })
);
async function setup() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/games/:gameId', name: 'game', component: Game },
      { path: '/games', name: 'games', component: { template: '<div />' } },
      { path: '/rules', name: 'rules', component: { template: '<div />' } }
    ]
  });
  await router.push('/games/game-1');
  const wrapper = mount(Game, { attachTo: document.body, global: { plugins: [router, validation] } });
  await flushPromises();
  return wrapper;
}
const findButton = (wrapper: ReturnType<typeof mount> | DOMWrapper<Element>, label: string) =>
  wrapper.findAll('button').find((b) => b.text().includes(label))!;

describe('game page', () => {
  it('clears the game transport when the page unmounts', async () => {
    const wrapper = await setup();
    const late = deferred<GameView>();
    api.getStarfallGame.mockReturnValueOnce(late.promise);
    window.dispatchEvent(new Event('online'));
    const request = api.getStarfallGame.mock.calls[1]![1];
    wrapper.unmount();
    expect(request.signal.aborted).toBe(true);
    late.resolve(makeGame({ version: 2 }));
    await flushPromises();
    window.dispatchEvent(new Event('online'));
    await flushPromises();
    expect(api.getStarfallGame).toHaveBeenCalledTimes(2);
  });
  it('renders all zones with SVG art and sends a play command', async () => {
    const wrapper = await setup();
    expect(wrapper.text()).toContain('Your hand');
    expect(wrapper.text()).toContain('Trade sector');
    expect(wrapper.text()).toContain('Alice');
    expect(wrapper.text()).toContain('Bob');
    expect(wrapper.findAll('img')).toHaveLength(0);
    expect(wrapper.findAll('svg').length).toBeGreaterThan(0);
    await findButton(wrapper, 'Play ship').trigger('click');
    await flushPromises();
    expect(api.executeStarfallCommand.mock.calls[0]![1]).toMatchObject({
      type: 'play_card',
      payload: { cardId: 'scout-1' },
      expectedVersion: 1
    });
  });
  it('buys an explorer by instance id', async () => {
    const wrapper = await setup();
    await findButton(wrapper, 'Buy Explorer').trigger('click');
    await flushPromises();
    expect(api.executeStarfallCommand.mock.calls[0]![1]).toMatchObject({
      type: 'buy_card',
      payload: { cardId: 'explorer-1' }
    });
  });
  it('replaces the pile modal with card details and restores scrolling on close', async () => {
    const originalOverflow = document.body.style.overflow;
    const game = makeGame();
    game.players[0]!.discard = [makeCard({ id: 'discard-1' })];
    api.getStarfallGame.mockResolvedValue(game);
    const wrapper = await setup();
    await findButton(wrapper, 'Discard (1)').trigger('click');
    const pile = new DOMWrapper(document.querySelector('dialog')!);
    expect(pile.get('h2').text()).toBe('Alice · Discard');
    await findButton(pile, 'Scout').trigger('click');
    expect(document.querySelectorAll('dialog')).toHaveLength(1);
    const details = new DOMWrapper(document.querySelector('dialog')!);
    expect(details.get('h2').text()).toBe('Scout');
    expect(details.text()).toContain('1 Trade');
    expect(document.body.style.overflow).toBe('hidden');
    await details.trigger('cancel');
    expect(document.querySelector('dialog')).toBeNull();
    expect(document.body.style.overflow).toBe(originalOverflow);
    expect(api.executeStarfallCommand).not.toHaveBeenCalled();
  });
  it('updates open card details from the latest game snapshot', async () => {
    const wrapper = await setup();
    await wrapper.get('[aria-label="View Scout details"]').trigger('click');
    const updated = makeGame({ version: 2 });
    updated.players[0]!.hand![0]!.money = 3;
    api.getStarfallGame.mockResolvedValue(updated);
    window.dispatchEvent(new Event('online'));
    await flushPromises();
    const details = new DOMWrapper(document.querySelector('dialog')!);
    expect(details.get('h2').text()).toBe('Scout');
    expect(details.text()).toContain('3 Trade');
  });
  it('cancels confirmation without sending and closes stale confirmation after a new snapshot', async () => {
    const wrapper = await setup();
    await findButton(wrapper, 'End turn').trigger('click');
    await findButton(new DOMWrapper(document.querySelector('dialog')!), 'Cancel').trigger('click');
    expect(document.querySelector('dialog')).toBeNull();
    expect(api.executeStarfallCommand).not.toHaveBeenCalled();
    await findButton(wrapper, 'End turn').trigger('click');
    api.getStarfallGame.mockResolvedValue(makeGame({ version: 2 }));
    window.dispatchEvent(new Event('online'));
    await flushPromises();
    expect(document.querySelector('dialog')).toBeNull();
    expect(api.executeStarfallCommand).not.toHaveBeenCalled();
  });
  it('requires confirmation for end turn with unused options', async () => {
    const wrapper = await setup();
    await findButton(wrapper, 'End turn').trigger('click');
    expect(api.executeStarfallCommand).not.toHaveBeenCalled();
    const dialog = new DOMWrapper(document.querySelector('dialog')!);
    expect(dialog.attributes('aria-labelledby')).toBe(dialog.get('h2').attributes('id'));
    await findButton(dialog, 'Confirm').trigger('click');
    await flushPromises();
    expect(api.executeStarfallCommand.mock.calls[0]![1].type).toBe('end_turn');
  });
  it('spends all remaining Combat on the opponent and hides the attack when it is exhausted', async () => {
    const afterAttack = makeGame({ version: 2 });
    afterAttack.players[0]!.attack = 0;
    api.executeStarfallCommand.mockResolvedValue(afterAttack);
    const wrapper = await setup();
    expect(wrapper.find('input[name="combat"]').exists()).toBe(false);
    await findButton(wrapper, 'Attack Bob · 5 Combat').trigger('click');
    await flushPromises();
    expect(api.executeStarfallCommand).toHaveBeenCalledTimes(1);
    expect(api.executeStarfallCommand.mock.calls[0]![1]).toMatchObject({
      type: 'attack_player',
      payload: { amount: 5 },
      expectedVersion: 1
    });
    expect(wrapper.findAll('button').some((button) => button.text().includes('Attack Bob'))).toBe(false);
  });
  it('disables purchases and hides player attacks when conditions are not met', async () => {
    const state = makeGame();
    state.players[0]!.money = 0;
    state.players[1]!.bases = [
      makeCard({ id: 'outpost', type: 'base' as GameCard['type'], outpost: true, currentDefense: 6 })
    ];
    api.getStarfallGame.mockResolvedValue(state);
    const wrapper = await setup();
    expect(findButton(wrapper, 'Buy Explorer').attributes('disabled')).toBeDefined();
    expect(wrapper.findAll('button').some((button) => button.text().includes('Attack Bob'))).toBe(false);
    expect(findButton(wrapper, 'Attack ·').attributes('disabled')).toBeDefined();
  });
  it('shows the waiting room without a manual start action', async () => {
    api.getStarfallGame.mockResolvedValue(makeGame({ status: 'waiting' as GameView['status'] }));
    const wrapper = await setup();
    expect(wrapper.text()).toContain('Waiting for an opponent');
    expect(wrapper.text()).not.toContain('Start game');
    expect(wrapper.text()).not.toContain('Your hand');
  });
  it('shows the winner and disables gameplay after finishing', async () => {
    api.getStarfallGame.mockResolvedValue(makeGame({ status: 'finished' as GameView['status'], winnerId: '1' }));
    const wrapper = await setup();
    expect(wrapper.text()).toContain('Victory');
    expect(wrapper.text()).not.toContain('End turn');
    expect(findButton(wrapper, 'Play ship').attributes('disabled')).toBeDefined();
  });
});
