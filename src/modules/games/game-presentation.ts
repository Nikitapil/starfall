import type { StarfallActionDto } from '@/api/swagger/Starfall/data-contracts';
import type { GameCard, GameView } from './game-types';

export const factionNames = {
  none: 'Unaligned',
  blobs: 'Blob',
  trades: 'Trade Federation',
  empire: 'Star Empire',
  techno: 'Machine Cult'
};
export const factionColors = {
  none: 'text-ink-muted',
  blobs: 'text-success',
  trades: 'text-accent',
  empire: 'text-warning',
  techno: 'text-danger'
};
export function describeEffect(action: StarfallActionDto): string {
  const count = action.value ?? 1;
  switch (action.name) {
    case 'plus_attack':
      return `Gain ${count} Combat`;
    case 'plus_money':
      return `Gain ${count} Trade`;
    case 'plus_authority':
      return `Gain ${count} Authority`;
    case 'get_cards':
      return `Draw ${count} ${count === 1 ? 'card' : 'cards'}`;
    case 'discard_opponent_card':
      return `Opponent discards ${count} ${count === 1 ? 'card' : 'cards'} at the start of their turn`;
    case 'scrap_card_from_hand':
      return 'Scrap a card from your hand';
    case 'scrap_card_from_pile':
      return 'Scrap a card from your discard pile';
    case 'scrap_card_from_hand_or_pile':
      return `${action.optional ? 'You may scrap up to' : 'Scrap'} ${action.max ?? 1} card(s) from your hand or discard${action.drawPerScrapped ? `; draw ${action.drawPerScrapped} per card scrapped` : ''}`;
    case 'scrap_card_from_trade_row':
      return 'You may scrap a card from the trade row';
    case 'destroy_base':
      return `${action.optional ? 'You may destroy' : 'Destroy'} an enemy base, ignoring defense and outposts`;
    case 'discard_then_draw':
      return `Discard up to ${action.max ?? 0} cards, then draw that many`;
    case 'put_next_ship_on_top':
      return 'Put your next purchased ship on top of your deck';
    case 'acquire_ship_for_free_on_top':
      return 'Acquire a ship from the trade row for free and put it on top of your deck';
    case 'copy_ship':
      return 'Copy another ship you have played this turn';
    case 'all_factions_ally':
      return 'Counts as an ally for every faction';
    case 'draw_per_faction_card':
      return `Draw a card for each ${action.fraction ? factionNames[action.fraction] : 'matching'} card in play`;
    case 'sequence':
      return (action.actions ?? []).map(describeEffect).join('; then ');
    case 'choose_one':
      return `Choose one: ${(action.options ?? []).map(describeEffects).join(' OR ')}`;
    case 'if_bases_in_play':
      return `If you have at least ${action.min ?? 0} bases: ${describeEffects(action.actions ?? [])}`;
    default:
      return 'Unknown effect';
  }
}
export function describeEffects(actions: StarfallActionDto[]) {
  return actions.map(describeEffect).join('; ');
}
export function canAttackBase(game: GameView, playerId: string, card: GameCard) {
  const attacker = game.players.find((p) => p.id === playerId);
  const defender = game.players.find((p) => p.id !== playerId);
  return (
    game.status === 'active' &&
    game.currentPlayerId === playerId &&
    !game.pendingAction &&
    !!defender?.bases.some((base) => base.id === card.id) &&
    !!attacker &&
    attacker.attack >= (card.currentDefense ?? card.health ?? 0) &&
    (card.outpost || !defender.bases.some((base) => base.outpost))
  );
}
export function pendingChoices(game: GameView, playerId: string) {
  const pending = game.pendingAction;
  const player = game.players.find((p) => p.id === playerId);
  const opponent = game.players.find((p) => p.id !== playerId);
  if (!pending || !player) {
    return null;
  }
  const hand = (player.hand ?? []).map((card) => ({ card, zone: 'Hand' }));
  const discard = player.discard.map((card) => ({ card, zone: 'Discard' }));
  const result = {
    title: '',
    cards: [] as { card: GameCard; zone: string }[],
    min: 1,
    max: 1,
    multiple: false,
    canCancel: false
  };
  switch (pending.type) {
    case 'choose_cards_to_scrap':
      return {
        ...result,
        title: 'Choose cards to scrap',
        multiple: true,
        min: pending.min ?? 1,
        max: pending.max ?? 1,
        canCancel: pending.min === 0,
        cards: [
          ...(pending.zones?.some((zone) => zone === 'player-hand') ? hand : []),
          ...(pending.zones?.some((zone) => zone === 'player-pile-deck') ? discard : [])
        ]
      };
    case 'discard_then_draw':
      return {
        ...result,
        title: 'Discard, then draw',
        multiple: true,
        min: 0,
        max: pending.max ?? 0,
        canCancel: true,
        cards: hand
      };
    case 'discard_for_opponent': {
      const count = Math.min(pending.count ?? 0, hand.length);
      return {
        ...result,
        title: 'Discard cards before your turn',
        multiple: true,
        min: count,
        max: count,
        cards: hand
      };
    }
    case 'choose_trade_card_to_scrap':
      return {
        ...result,
        title: 'Scrap a trade row card',
        canCancel: !!pending.optional,
        cards: game.tradeRow.map((card) => ({ card, zone: 'Trade row' }))
      };
    case 'choose_base_to_destroy':
      return {
        ...result,
        title: 'Destroy an enemy base',
        canCancel: !!pending.optional,
        cards: (opponent?.bases ?? []).map((card) => ({ card, zone: 'Enemy base' }))
      };
    case 'choose_ship_to_copy':
      return {
        ...result,
        title: 'Copy a played ship',
        canCancel: true,
        cards: player.playedShips
          .filter((card) => card.id !== pending.sourceCardId && card.type === 'ship')
          .map((card) => ({ card, zone: 'Played ship' }))
      };
    case 'choose_free_ship':
      return {
        ...result,
        title: 'Acquire a free ship',
        canCancel: true,
        cards: game.tradeRow.filter((card) => card.type === 'ship').map((card) => ({ card, zone: 'Trade row' }))
      };
    case 'choose_effect':
      return { ...result, title: 'Choose an effect' };
  }
}
