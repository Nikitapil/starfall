import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import PendingActionPanel from '@/modules/games/components/board/PendingActionPanel.vue';
import { canAttackBase, describeEffect, pendingChoices } from '@/modules/games/game-presentation';
import { StarfallActionDtoNameEnum } from '@/api/swagger/Starfall/data-contracts';
import type { StarfallPendingActionDto, StarfallActionDto } from '@/api/swagger/Starfall/data-contracts';
import type { GameCard, GameView } from '@/modules/games/game-types';
import { makeCard, makeGame } from './helpers/game-fixtures';

function choiceGame(
  pending: Omit<Partial<StarfallPendingActionDto>, 'type'> & { type: StarfallPendingActionDto['type'] | string }
) {
  const game = makeGame();
  game.players[0]!.hand = [makeCard({ id: 'hand-1' }), makeCard({ id: 'hand-2' })];
  game.players[0]!.discard = [makeCard({ id: 'discard-1' })];
  game.players[0]!.playedShips = [makeCard({ id: 'source' }), makeCard({ id: 'copy-target' })];
  game.players[1]!.bases = [makeCard({ id: 'enemy-base', type: 'base' as GameCard['type'], health: 6, outpost: true })];
  game.tradeRow = [makeCard({ id: 'trade-ship' }), makeCard({ id: 'trade-base', type: 'base' as GameCard['type'] })];
  game.pendingAction = {
    playerId: '1',
    sourceCardId: 'source',
    abilityId: 'primary:0',
    ...pending
  } as StarfallPendingActionDto;
  return game;
}
const button = (wrapper: ReturnType<typeof mount>, label: string) =>
  wrapper.findAll('button').find((b) => b.text().includes(label))!;

describe('pending choices', () => {
  it.each<[string, string, number]>([
    ['choose_trade_card_to_scrap', 'trade-ship', 2],
    ['choose_base_to_destroy', 'enemy-base', 1],
    ['choose_ship_to_copy', 'copy-target', 1],
    ['choose_free_ship', 'trade-ship', 1]
  ])('selects a legal single target for %s', async (type, target, count) => {
    const game = choiceGame({ type });
    const choices = pendingChoices(game, '1')!;
    expect(choices.cards[0]!.card.id).toBe(target);
    expect(choices.cards).toHaveLength(count);
    const wrapper = mount(PendingActionPanel, { props: { game, playerId: '1', disabled: false, loading: false } });
    expect(button(wrapper, 'Confirm choice').attributes('disabled')).toBeDefined();
    await button(wrapper, 'Select card').trigger('click');
    await wrapper.setProps({ game: { ...game } });
    expect(button(wrapper, 'Selected — remove').attributes('aria-pressed')).toBe('true');
    await button(wrapper, 'Confirm choice').trigger('click');
    expect(wrapper.emitted('action')![0]).toEqual([{ type: 'resolve_pending', payload: { cardId: target } }]);
    await wrapper.setProps({ game: { ...game, version: game.version + 1 } });
    expect(wrapper.text()).toContain('0 selected');
    expect(button(wrapper, 'Confirm choice').attributes('disabled')).toBeDefined();
    wrapper.unmount();
  });
  it('selects scrap cards only from the specified zones, enforces maximum, and allows skip at min zero', async () => {
    const game = choiceGame({
      type: 'choose_cards_to_scrap',
      zones: ['player-hand'] as StarfallPendingActionDto['zones'],
      min: 0,
      max: 1
    });
    expect(pendingChoices(game, '1')!.cards.map((c) => c.card.id)).toEqual(['hand-1', 'hand-2']);
    const wrapper = mount(PendingActionPanel, { props: { game, playerId: '1', disabled: false, loading: false } });
    await button(wrapper, 'Select card').trigger('click');
    expect(button(wrapper, 'Select card').attributes('disabled')).toBeDefined();
    await button(wrapper, 'Confirm choice').trigger('click');
    expect(wrapper.emitted('action')![0]).toEqual([{ type: 'resolve_pending', payload: { cardIds: ['hand-1'] } }]);
    await button(wrapper, 'Skip effect').trigger('click');
    expect(wrapper.emitted('action')![1]).toEqual([{ type: 'cancel_pending', payload: {} }]);
    wrapper.unmount();
  });
  it('allows an empty discard-then-draw choice', async () => {
    const game = choiceGame({ type: 'discard_then_draw', max: 2 });
    const wrapper = mount(PendingActionPanel, { props: { game, playerId: '1', disabled: false, loading: false } });
    await button(wrapper, 'Confirm choice').trigger('click');
    expect(wrapper.emitted('action')![0]).toEqual([{ type: 'resolve_pending', payload: { cardIds: [] } }]);
    wrapper.unmount();
  });
  it('requires exactly the available opponent-discard count and disallows cancel', async () => {
    const game = choiceGame({ type: 'discard_for_opponent', count: 4 });
    const wrapper = mount(PendingActionPanel, { props: { game, playerId: '1', disabled: false, loading: false } });
    expect(wrapper.text()).not.toContain('Skip effect');
    await button(wrapper, 'Select card').trigger('click');
    expect(button(wrapper, 'Confirm choice').attributes('disabled')).toBeDefined();
    await button(wrapper, 'Select card').trigger('click');
    await button(wrapper, 'Confirm choice').trigger('click');
    expect(wrapper.emitted('action')![0]).toEqual([
      { type: 'resolve_pending', payload: { cardIds: ['hand-1', 'hand-2'] } }
    ]);
    wrapper.unmount();
  });
  it('sends a zero-based effect index, preserves selection at the same version, and resets at a new version', async () => {
    const game = choiceGame({
      type: 'choose_effect',
      options: [[{ name: 'plus_money', value: 3 }], [{ name: 'plus_attack', value: 5 }]] as StarfallActionDto[][]
    });
    const wrapper = mount(PendingActionPanel, { props: { game, playerId: '1', disabled: false, loading: false } });
    await button(wrapper, 'Option 2').trigger('click');
    await wrapper.setProps({ game: { ...game } });
    expect(button(wrapper, 'Selected 2').attributes('aria-pressed')).toBe('true');
    await button(wrapper, 'Confirm choice').trigger('click');
    expect(wrapper.emitted('action')![0]).toEqual([{ type: 'resolve_pending', payload: { optionIndex: 1 } }]);
    await wrapper.setProps({ game: { ...game, version: game.version + 1 } });
    expect(button(wrapper, 'Option 2').attributes('aria-pressed')).toBe('false');
    expect(button(wrapper, 'Confirm choice').attributes('disabled')).toBeDefined();
    wrapper.unmount();
  });
  it('does not offer skip for mandatory base destruction or mandatory scrap', () => {
    expect(pendingChoices(choiceGame({ type: 'choose_base_to_destroy', optional: false }), '1')!.canCancel).toBe(false);
    expect(pendingChoices(choiceGame({ type: 'choose_cards_to_scrap', min: 1, max: 1 }), '1')!.canCancel).toBe(false);
  });
});

describe('game presentation', () => {
  it('describes every server effect and recursive combinations', () => {
    for (const name of Object.values(StarfallActionDtoNameEnum)) {
      const text = describeEffect({
        name,
        value: 2,
        min: 1,
        max: 2,
        actions: [{ name: StarfallActionDtoNameEnum.PlusMoney, value: 1 }],
        options: [[{ name: StarfallActionDtoNameEnum.GetCards, value: 1 }]]
      });
      expect(text.length).toBeGreaterThan(5);
      expect(text).not.toContain('Unknown');
      expect(text).not.toContain('undefined');
    }
    expect(
      describeEffect({
        name: StarfallActionDtoNameEnum.Sequence,
        actions: [
          { name: StarfallActionDtoNameEnum.GetCards, value: 1 },
          { name: StarfallActionDtoNameEnum.PlusAttack, value: 3 }
        ]
      })
    ).toBe('Draw 1 card; then Gain 3 Combat');
  });
  it('enforces outposts and sufficient combat for ordinary base attacks', () => {
    const game = makeGame();
    const outpost = makeCard({ id: 'outpost', type: 'base' as GameCard['type'], outpost: true, currentDefense: 4 });
    const base = makeCard({ id: 'base', type: 'base' as GameCard['type'], currentDefense: 3 });
    game.players[1]!.bases = [outpost, base];
    expect(canAttackBase(game, '1', base)).toBe(false);
    expect(canAttackBase(game, '1', outpost)).toBe(true);
    game.players[0]!.attack = 3;
    expect(canAttackBase(game, '1', outpost)).toBe(false);
    game.players[1]!.bases = [base];
    expect(canAttackBase(game, '1', base)).toBe(true);
    expect(canAttackBase({ ...game, status: 'finished' as GameView['status'] }, '1', base)).toBe(false);
  });
});
