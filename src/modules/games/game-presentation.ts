import { i18n } from '@/plugins/i18n';
import type { StarfallActionDto, StarfallAbilityStateDto } from '@/api/swagger/Starfall/data-contracts';
import type { GameCard, GameView } from './game-types';

const { t } = i18n.global;

export const factionNames = {
  get none() {
    return t('game.factions.none');
  },
  get blobs() {
    return t('game.factions.blobs');
  },
  get trades() {
    return t('game.factions.trades');
  },
  get empire() {
    return t('game.factions.empire');
  },
  get techno() {
    return t('game.factions.techno');
  }
};
export const factionColors = {
  none: 'text-ink-muted',
  blobs: 'text-success',
  trades: 'text-accent',
  empire: 'text-warning',
  techno: 'text-danger'
};
export function describeAbility(ability: StarfallAbilityStateDto, actionable = false): string {
  let label = t(
    actionable && ability.kind === 'primary' ? 'game.abilities.activate' : `game.abilities.${ability.kind}`
  );
  if (ability.id.startsWith('copied:')) label = t('game.abilities.copied', { ability: label });
  return ability.isUsed ? t('game.abilities.used', { ability: label }) : label;
}
export function describeEffect(action: StarfallActionDto): string {
  const count = action.value ?? 1;
  switch (action.name) {
    case 'plus_attack':
      return t('game.effects.combat', { count });
    case 'plus_money':
      return t('game.effects.trade', { count });
    case 'plus_authority':
      return t('game.effects.authority', { count });
    case 'get_cards':
      return t('game.effects.draw', count);
    case 'discard_opponent_card':
      return t('game.effects.opponentDiscard', count);
    case 'scrap_card_from_hand':
      return t('game.effects.scrapHand');
    case 'scrap_card_from_pile':
      return t('game.effects.scrapDiscard');
    case 'scrap_card_from_hand_or_pile': {
      const scrap = action.optional
        ? t('game.effects.scrapOptional', { count: action.max ?? 1 })
        : t('game.effects.scrapRequired', { count: action.max ?? 1 });
      return action.drawPerScrapped
        ? t('game.effects.scrapAndDraw', {
            scrap,
            draw: t('game.effects.drawPerScrapped', { count: action.drawPerScrapped })
          })
        : scrap;
    }
    case 'scrap_card_from_trade_row':
      return t('game.effects.scrapTrade');
    case 'destroy_base':
      return t(action.optional ? 'game.effects.destroyOptional' : 'game.effects.destroy');
    case 'discard_then_draw':
      return t('game.effects.discardDraw', { count: action.max ?? 0 });
    case 'put_next_ship_on_top':
      return t('game.effects.nextShip');
    case 'acquire_ship_for_free_on_top':
      return t('game.effects.freeShip');
    case 'copy_ship':
      return t('game.effects.copy');
    case 'all_factions_ally':
      return t('game.effects.allFactions');
    case 'draw_per_faction_card':
      return action.fraction
        ? t('game.effects.drawFaction', { faction: factionNames[action.fraction] })
        : t('game.effects.drawMatching');
    case 'sequence':
      return (action.actions ?? []).map(describeEffect).join(t('game.effects.then'));
    case 'choose_one':
      return t('game.effects.choose', {
        options: (action.options ?? []).map(describeEffects).join(t('game.effects.or'))
      });
    case 'if_bases_in_play':
      return t('game.effects.ifBases', { count: action.min ?? 0, effects: describeEffects(action.actions ?? []) });
    default:
      return t('game.effects.unknown');
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
  const hand = (player.hand ?? []).map((card) => ({ card, zone: t('game.zones.hand') }));
  const discard = player.discard.map((card) => ({ card, zone: t('game.zones.discard') }));
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
        title: t('game.choices.scrap'),
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
        title: t('game.choices.discardDraw'),
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
        title: t('game.choices.opponentDiscard'),
        multiple: true,
        min: count,
        max: count,
        cards: hand
      };
    }
    case 'choose_trade_card_to_scrap':
      return {
        ...result,
        title: t('game.choices.scrapTrade'),
        canCancel: !!pending.optional,
        cards: game.tradeRow.map((card) => ({ card, zone: t('game.zones.tradeRow') }))
      };
    case 'choose_base_to_destroy':
      return {
        ...result,
        title: t('game.choices.destroy'),
        canCancel: !!pending.optional,
        cards: (opponent?.bases ?? []).map((card) => ({ card, zone: t('game.zones.enemyBase') }))
      };
    case 'choose_ship_to_copy':
      return {
        ...result,
        title: t('game.choices.copy'),
        canCancel: true,
        cards: player.playedShips
          .filter((card) => card.id !== pending.sourceCardId && card.type === 'ship')
          .map((card) => ({ card, zone: t('game.zones.playedShip') }))
      };
    case 'choose_free_ship':
      return {
        ...result,
        title: t('game.choices.free'),
        canCancel: true,
        cards: game.tradeRow
          .filter((card) => card.type === 'ship')
          .map((card) => ({ card, zone: t('game.zones.tradeRow') }))
      };
    case 'choose_effect':
      return { ...result, title: t('game.choices.effect') };
  }
}
