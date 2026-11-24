import { realtimeMock } from './helpers/mock-game-realtime';
vi.mock('@/modules/games/game-realtime', () => import('./helpers/mock-game-realtime'));
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DOMWrapper, enableAutoUnmount, flushPromises, mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { createRouter, createMemoryHistory } from 'vue-router';
import Game from '@/modules/games/pages/Game.vue';
import { validation } from '@/plugins/validation';
import { i18n } from '@/plugins/i18n';
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
  wrapper.findAll('button').find((b) => (b.attributes('aria-label') ?? b.text()).includes(label))!;
const inspectCard = async ({ element }: { element: Element }) => {
  element.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
  await vi.waitFor(() => expect(document.querySelector('dialog')).not.toBeNull());
};
const doubleClick = async ({ element }: { element: Element }) => {
  element.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
  await nextTick();
  element.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 2 }));
  await nextTick();
  element.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, detail: 2 }));
  await flushPromises();
};

describe('game page', () => {
  it('translates an open confirmation and discard pile without sending commands', async () => {
    const wrapper = await setup();
    await findButton(wrapper, 'End turn').trigger('click');
    const dialog = document.querySelector('dialog');
    expect(dialog?.textContent).toContain('End your turn?');
    i18n.global.locale.value = 'rus';
    await flushPromises();
    expect(document.querySelector('dialog')).toBe(dialog);
    expect(dialog?.textContent).toContain('Завершить ход?');
    expect(dialog?.textContent).toContain('Неиспользованные ресурсы исчезнут');
    await findButton(new DOMWrapper(dialog!), 'Отмена').trigger('click');
    await findButton(wrapper, 'Сброс').trigger('click');
    expect(document.querySelector('dialog h2')?.textContent).toBe('Bob · Сброс');
    i18n.global.locale.value = 'eng';
    await flushPromises();
    expect(document.querySelector('dialog h2')?.textContent).toBe('Bob · Discard');
    expect(api.executeStarfallCommand).not.toHaveBeenCalled();
  });

  it('clears the socket when the page unmounts', async () => {
    const wrapper = await setup();
    wrapper.unmount();
    expect(realtimeMock.clear).toHaveBeenCalledOnce();
    await flushPromises();
    expect(api.getStarfallGame).toHaveBeenCalledTimes(1);
  });
  it('renders all zones with SVG art and sends a play command', async () => {
    const wrapper = await setup();
    expect(wrapper.get('.hand-zone').attributes('aria-label')).toBe('Your hand');
    expect(wrapper.get('.market-lane').attributes('aria-label')).toBe('Trade sector');
    expect(wrapper.text()).toContain('Alice');
    expect(wrapper.text()).toContain('Bob');
    expect(wrapper.findAll('img')).toHaveLength(0);
    expect(wrapper.findAll('svg').length).toBeGreaterThan(0);
    await inspectCard(wrapper.get('button[aria-label="View Scout details"]'));
    await findButton(new DOMWrapper(document.querySelector('dialog')!), 'Play ship').trigger('click');
    await flushPromises();
    expect(api.executeStarfallCommand.mock.calls[0]![1]).toMatchObject({
      type: 'play_card',
      payload: { cardId: 'scout-1' },
      expectedVersion: 1
    });
  });
  it('shows every board area together without navigation tabs', async () => {
    const wrapper = await setup();
    expect(wrapper.find('nav').exists()).toBe(false);
    for (const selector of ['.enemy-lane', '.market-lane', '.own-lane', '.hand-zone']) {
      expect(wrapper.get(selector).isVisible()).toBe(true);
    }
    expect(wrapper.find('.table-card.is-actionable').exists()).toBe(true);
    expect(api.executeStarfallCommand).not.toHaveBeenCalled();
  });

  it('keeps required choices visible and blocks normal card actions', async () => {
    api.getStarfallGame.mockResolvedValue(
      makeGame({
        pendingAction: {
          type: 'choose_effect',
          playerId: '1',
          options: [[{ name: 'plus_money', value: 2 }]]
        } as GameView['pendingAction']
      })
    );
    const wrapper = await setup();
    expect(wrapper.get('[aria-labelledby="pending-title"]').isVisible()).toBe(true);
    await inspectCard(wrapper.get('button[aria-label="View Scout details"]'));
    const details = new DOMWrapper(document.querySelector('dialog')!);
    expect(findButton(details, 'Play ship').attributes('disabled')).toBeDefined();
    await details.trigger('cancel');
    await findButton(wrapper, 'Gain 2 Trade').trigger('click');
    await findButton(wrapper, 'Confirm choice').trigger('click');
    await flushPromises();
    expect(api.executeStarfallCommand.mock.calls[0]![1]).toMatchObject({
      type: 'resolve_pending',
      payload: { optionIndex: 0 }
    });
  });

  it('shows names and every printed ability directly on the table card', async () => {
    const game = makeGame();
    game.tradeRow = [
      makeCard({
        id: 'full-card',
        name: 'Long named command carrier',
        abilities: [{ name: 'get_cards', value: 2 }] as GameCard['abilities'],
        matchAbilities: [{ name: 'plus_attack', value: 3 }] as GameCard['matchAbilities'],
        removeAbility: { name: 'plus_money', value: 4 } as GameCard['removeAbility'],
        persistentAbilities: [
          { trigger: 'ship_played', action: { name: 'plus_authority', value: 1 } }
        ] as GameCard['persistentAbilities'],
        abilityStates: [
          {
            id: 'primary:0',
            kind: 'primary',
            action: { name: 'get_cards', value: 2 },
            isAvailable: false,
            isUsed: false
          }
        ] as GameCard['abilityStates']
      })
    ];
    api.getStarfallGame.mockResolvedValue(game);
    const wrapper = await setup();
    const card = wrapper.get('[aria-label="View Long named command carrier details"]');
    expect(card.text()).toContain('Long named command carrier');
    expect(card.text()).toContain('Draw 2 cards');
    expect(card.text()).toContain('Ally: +3 Combat');
    expect(card.text()).toContain('Scrap: +4 Trade');
    expect(card.text()).toContain('+1 Authority');
    expect(card.findAll('.card-effect')).toHaveLength(4);
    expect(document.querySelector('dialog')).toBeNull();
    i18n.global.locale.value = 'rus';
    await flushPromises();
    expect(card.text()).toContain('Союзная: +3 к бою');
    expect(api.executeStarfallCommand).not.toHaveBeenCalled();
  });

  it('opens full printed effects from a compact hand card without playing it', async () => {
    const game = makeGame();
    game.players[0]!.hand![0]!.abilities = [{ name: 'get_cards', value: 2 } as GameCard['abilities'][number]];
    api.getStarfallGame.mockResolvedValue(game);
    const wrapper = await setup();
    const detailsButton = wrapper.get('button[aria-label="View Scout details"]');
    await inspectCard(detailsButton);
    expect(document.querySelector('dialog')?.textContent).toContain('Draw 2 cards');
    expect(api.executeStarfallCommand).not.toHaveBeenCalled();
  });

  it('buys an explorer by instance id', async () => {
    const wrapper = await setup();
    await inspectCard(wrapper.get('button[aria-label="View Explorer details"]'));
    await findButton(new DOMWrapper(document.querySelector('dialog')!), 'Buy').trigger('click');
    await flushPromises();
    expect(api.executeStarfallCommand.mock.calls[0]![1]).toMatchObject({
      type: 'buy_card',
      payload: { cardId: 'explorer-1' }
    });
  });
  it.each([
    ['Scout', 'play_card', 'scout-1'],
    ['Cutter', 'buy_card', 'trade-1'],
    ['Explorer', 'buy_card', 'explorer-1']
  ])('double click on %s sends one %s command without opening details', async (name, type, cardId) => {
    const wrapper = await setup();
    await doubleClick(wrapper.get(`[aria-label="View ${name} details"]`));
    expect(api.executeStarfallCommand).toHaveBeenCalledTimes(1);
    expect(api.executeStarfallCommand.mock.calls[0]![1]).toMatchObject({ type, payload: { cardId } });
    expect(document.querySelector('dialog')).toBeNull();
  });

  it('double click does not send another command while the first is in flight', async () => {
    const pending = deferred<GameView>();
    api.executeStarfallCommand.mockReturnValueOnce(pending.promise);
    const wrapper = await setup();
    const card = wrapper.get('[aria-label="View Explorer details"]');
    await doubleClick(card);
    await doubleClick(card);
    expect(api.executeStarfallCommand).toHaveBeenCalledTimes(1);
    pending.resolve(makeGame({ version: 2 }));
    await flushPromises();
  });

  it.each(['cost', 'turn', 'pending', 'finished'])('double click respects the %s restriction', async (reason) => {
    const game = makeGame();
    if (reason === 'cost') game.players[0]!.money = 0;
    if (reason === 'turn') game.currentPlayerId = '2';
    if (reason === 'pending')
      game.pendingAction = {
        type: 'choose_effect',
        playerId: '1',
        options: [[{ name: 'plus_money', value: 2 }]]
      } as GameView['pendingAction'];
    if (reason === 'finished') game.status = 'finished' as GameView['status'];
    api.getStarfallGame.mockResolvedValue(game);
    const wrapper = await setup();
    await doubleClick(wrapper.get('[aria-label="View Explorer details"]'));
    expect(api.executeStarfallCommand).not.toHaveBeenCalled();
    expect(document.querySelector('dialog h2')?.textContent).toBe('Explorer');
    expect(findButton(new DOMWrapper(document.querySelector('dialog')!), 'Buy').attributes('disabled')).toBeDefined();
  });

  it.each([false, true])('double click on an enemy base respects outpost protection: %s', async (protectedBase) => {
    const game = makeGame();
    game.players[1]!.bases = [makeCard({ id: 'base', type: 'base' as GameCard['type'], currentDefense: 3 })];
    if (protectedBase)
      game.players[1]!.bases.push(
        makeCard({ id: 'outpost', type: 'base' as GameCard['type'], outpost: true, currentDefense: 6 })
      );
    api.getStarfallGame.mockResolvedValue(game);
    const wrapper = await setup();
    await doubleClick(wrapper.get('.enemy-lane .table-card'));
    expect(
      api.executeStarfallCommand.mock.calls.map(([, command]) => ({ type: command.type, payload: command.payload }))
    ).toEqual(protectedBase ? [] : [{ type: 'attack_base', payload: { cardId: 'base' } }]);
  });

  it.each(['primary', 'scrap', 'multiple', 'used', 'unavailable'])(
    'double click on a played card handles %s abilities',
    async (kind) => {
      const game = makeGame();
      const ability = {
        id: `${kind}:0`,
        kind: kind === 'scrap' ? 'scrap' : 'primary',
        action: { name: 'plus_money', value: 2 },
        isAvailable: kind !== 'unavailable',
        isUsed: kind === 'used'
      } as GameCard['abilityStates'][number];
      game.players[0]!.playedShips = [
        makeCard({
          id: 'played',
          abilityStates: kind === 'multiple' ? [ability, { ...ability, id: 'primary:1' }] : [ability]
        })
      ];
      api.getStarfallGame.mockResolvedValue(game);
      const wrapper = await setup();
      await doubleClick(wrapper.get('.own-lane .table-card'));
      expect(
        api.executeStarfallCommand.mock.calls.map(([, command]) => ({ type: command.type, payload: command.payload }))
      ).toEqual(
        kind === 'primary' ? [{ type: 'use_ability', payload: { cardId: 'played', abilityId: 'primary:0' } }] : []
      );
      expect(document.querySelectorAll('dialog')).toHaveLength(kind === 'primary' ? 0 : 1);
      expect(document.querySelector('dialog h2')?.textContent).toBe(
        kind === 'primary' ? undefined : kind === 'scrap' ? 'Scrap Scout?' : 'Scout'
      );
    }
  );

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
    await inspectCard(wrapper.get('[aria-label="View Scout details"]'));
    const updated = makeGame({ version: 2 });
    updated.players[0]!.hand![0]!.money = 3;
    realtimeMock.callbacks!.onState(updated);
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
    realtimeMock.callbacks!.onState(makeGame({ version: 2 }));
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
    await inspectCard(wrapper.get('button[aria-label="View Explorer details"]'));
    const purchase = new DOMWrapper(document.querySelector('dialog')!);
    expect(findButton(purchase, 'Buy').attributes('disabled')).toBeDefined();
    await purchase.trigger('cancel');
    expect(wrapper.findAll('button').some((button) => button.text().includes('Attack Bob'))).toBe(false);
    await inspectCard(wrapper.get('.enemy-lane .table-card'));
    expect(
      findButton(new DOMWrapper(document.querySelector('dialog')!), 'Attack ·').attributes('disabled')
    ).toBeDefined();
  });
  it('replaces card details with scrap confirmation and sends the selected ability', async () => {
    const game = makeGame();
    game.players[0]!.playedShips = [
      makeCard({
        id: 'played-scout',
        abilityStates: [
          {
            id: 'scrap:0',
            kind: 'scrap',
            action: { name: 'plus_money', value: 2 },
            isAvailable: true,
            isUsed: false
          } as GameCard['abilityStates'][number]
        ]
      })
    ];
    api.getStarfallGame.mockResolvedValue(game);
    const wrapper = await setup();
    await inspectCard(wrapper.get('.own-lane .table-card'));
    await findButton(new DOMWrapper(document.querySelector('dialog')!), 'Scrap:').trigger('click');
    expect(document.querySelectorAll('dialog')).toHaveLength(1);
    expect(document.querySelector('dialog')?.textContent).toContain('Scrap Scout?');
    expect(api.executeStarfallCommand).not.toHaveBeenCalled();
    await findButton(new DOMWrapper(document.querySelector('dialog')!), 'Confirm').trigger('click');
    await flushPromises();
    expect(api.executeStarfallCommand.mock.calls[0]![1]).toMatchObject({
      type: 'use_ability',
      payload: { cardId: 'played-scout', abilityId: 'scrap:0' }
    });
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
    await inspectCard(wrapper.get('button[aria-label="View Scout details"]'));
    const details = new DOMWrapper(document.querySelector('dialog')!);
    expect(findButton(details, 'Play ship').attributes('disabled')).toBeDefined();
    await details.trigger('cancel');
  });
});
