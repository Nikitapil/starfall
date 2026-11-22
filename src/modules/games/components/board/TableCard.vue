<script setup lang="ts">
import { computed, onBeforeUnmount } from 'vue';
import { useI18n } from '@/plugins/i18n';
import IconGameResource from '@/components/icons/IconGameResource.vue';
import type { GameCard } from '../../game-types';
import type { StarfallActionDto } from '@/api/swagger/Starfall/data-contracts';
import { describeEffect, describeAbility, factionColors, factionNames } from '../../game-presentation';
import CardArt from './CardArt.vue';

const props = defineProps<{
  card: GameCard;
  actionable?: boolean;
  market?: boolean;
  remaining?: number;
  inPlay?: boolean;
}>();
const emit = defineEmits<{ inspect: [card: GameCard]; activate: [card: GameCard] }>();
const { t } = useI18n();
const DOUBLE_CLICK_DELAY = 350;
let inspectionTimer: ReturnType<typeof setTimeout> | undefined;
let clickTarget: HTMLElement | null = null;
const cancelInspection = () => {
  clearTimeout(inspectionTimer);
  inspectionTimer = undefined;
  clickTarget = null;
  document.removeEventListener('pointerdown', cancelOutsideInspection, true);
};
const cancelOutsideInspection = (event: PointerEvent) => {
  if (!clickTarget?.contains(event.target as Node)) cancelInspection();
};
const handleClick = (event: MouseEvent) => {
  if (event.detail > 1) return;
  // Wait for dblclick so the details dialog cannot intercept the second click.
  cancelInspection();
  clickTarget = event.currentTarget as HTMLElement;
  document.addEventListener('pointerdown', cancelOutsideInspection, true);
  inspectionTimer = setTimeout(() => {
    cancelInspection();
    emit('inspect', props.card);
  }, DOUBLE_CLICK_DELAY);
};
const handleDoubleClick = () => {
  cancelInspection();
  emit('activate', props.card);
};
onBeforeUnmount(cancelInspection);
const describeCardEffect = (action: StarfallActionDto) => {
  const count = action.value ?? 1;
  if (action.name === 'plus_attack') return t('game.board.effectCombat', { count });
  if (action.name === 'plus_money') return t('game.board.effectTrade', { count });
  if (action.name === 'plus_authority') return t('game.board.effectAuthority', { count });
  return describeEffect(action);
};
const effects = computed(() => {
  const printed = [
    ...props.card.abilities.map((action) => ({ kind: 'primary', action, label: '' })),
    ...props.card.matchAbilities.map((action) => ({ kind: 'ally', action, label: t('game.abilities.ally') })),
    ...(props.card.removeAbility
      ? [{ kind: 'scrap', action: props.card.removeAbility, label: t('game.abilities.scrap') }]
      : []),
    ...props.card.persistentAbilities.map((ability) => ({
      kind: 'persistent',
      action: ability.action,
      label: t('game.abilities.onShip')
    }))
  ];
  const extra = props.card.abilityStates
    .filter(
      (ability) =>
        ability.id.startsWith('copied:') ||
        !printed.some(
          (effect) => effect.kind === ability.kind && JSON.stringify(effect.action) === JSON.stringify(ability.action)
        )
    )
    .map((ability) => ({ kind: ability.kind, action: ability.action, label: describeAbility(ability) }));
  return [...printed, ...extra];
});
</script>
<template>
  <button
    type="button"
    class="table-card"
    :class="[
      { 'is-actionable': actionable, 'is-outpost': card.outpost, 'is-in-play': inPlay },
      factionColors[card.fraction]
    ]"
    :aria-label="t('game.cardDetails', { name: card.name })"
    :title="`${card.name} · ${factionNames[card.fraction]} · ${t(`game.cardTypes.${card.outpost ? 'outpost' : card.type}`)}`"
    @click="handleClick"
    @dblclick.prevent="handleDoubleClick"
    @blur="cancelInspection"
    @keydown.esc="cancelInspection"
  >
    <span class="card-content">
      <span class="card-heading">
        <span class="card-name text-ink">{{ card.name }}</span>
        <span
          v-if="market"
          class="card-cost text-warning"
          :aria-label="t('game.cardCost', { count: card.cost })"
        >
          {{ card.cost }}
        </span>
      </span>
      <span class="card-art-slot">
        <CardArt
          class="card-art"
          :type="card.type"
          :outpost="card.outpost"
          :fraction="card.fraction"
        />
      </span>
      <span class="card-faction">
        <span class="font-semibold text-ink-muted">
          {{ t(`game.cardTypes.${card.type}`) }}
          <template v-if="card.outpost"> · {{ t('game.cardTypes.outpost') }}</template>
        </span>
        · {{ factionNames[card.fraction] }}
      </span>
      <span
        v-if="effects.length"
        class="card-effects text-ink"
      >
        <span
          v-for="(effect, index) in effects"
          :key="index"
          class="card-effect"
        >
          <strong
            v-if="effect.label"
            :class="effect.kind === 'scrap' ? 'text-danger' : 'text-accent'"
          >
            {{ effect.label }}:
          </strong>
          {{ describeCardEffect(effect.action) }}
        </span>
      </span>
      <span class="card-resources">
        <span
          v-if="card.money"
          class="text-warning"
          :aria-label="t('game.resources.trade', { count: card.money })"
        >
          <IconGameResource kind="trade" />{{ card.money }}
        </span>
        <span
          v-if="card.attack"
          class="text-danger"
          :aria-label="t('game.resources.combat', { count: card.attack })"
        >
          <IconGameResource kind="combat" />{{ card.attack }}</span
        >
        <span
          v-if="card.type === 'base'"
          class="text-ink"
          :aria-label="t('game.resources.defense', { count: card.currentDefense ?? card.health ?? 0 })"
        >
          <IconGameResource kind="defense" />
          {{ card.currentDefense ?? card.health ?? 0 }}
        </span>
        <span
          v-if="remaining !== undefined"
          class="remaining-count text-ink-muted"
          :title="t('game.remaining', { count: remaining })"
          :aria-label="t('game.remaining', { count: remaining })"
        >
          <IconGameResource kind="deck" />
          {{ remaining }}
        </span>
      </span>
    </span>
    <span
      v-if="actionable"
      class="action-marker"
      :aria-label="t('game.board.available')"
    />
  </button>
</template>
<style scoped>
.table-card {
  container-type: size;
  position: relative;
  touch-action: manipulation;
  user-select: none;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  height: 100%;
  overflow: visible;
  border: 1px solid var(--color-line-strong);
  border-top: 2px solid currentColor;
  border-radius: 0.35em;
  padding: 0.3em;
  font-size: inherit;
  background: linear-gradient(155deg, var(--color-surface-raised), var(--color-canvas));
  text-align: left;
  box-shadow: 0 3px 8px rgb(0 0 0 / 0.35);
  transition:
    border-color 150ms,
    background-color 150ms,
    transform 150ms;
}
.card-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  min-height: 0;
  font-size: min(1em, 12cqh, 9cqw);
  line-height: 1.2;
}
.table-card:has(.card-effect:nth-child(2)) .card-content {
  font-size: min(1em, 10cqh, 8cqw);
}
.table-card:has(.card-effect:nth-child(4)) .card-content {
  font-size: min(0.9em, 7cqh, 6.25cqw);
}
.table-card:has(.card-effect:nth-child(6)) .card-content {
  font-size: min(0.85em, 6cqh, 6cqw);
}
.table-card:hover,
.table-card:focus-visible {
  background: var(--color-surface-hover);
  transform: translateY(-2px);
}
.is-actionable {
  border-color: var(--color-accent);
  box-shadow: 0 0 10px color-mix(in srgb, var(--color-accent) 12%, transparent);
}
.is-outpost {
  border-bottom: 3px double var(--color-ink-muted);
}
.card-heading {
  display: flex;
  align-items: start;
  gap: 0.2em;
  min-height: 0;
  flex-shrink: 0;
}
.card-name {
  display: block;
  overflow-wrap: anywhere;
  font-size: 0.95em;
  font-weight: 600;
  line-height: 1.15;
  flex: 1;
}
.card-cost {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 1.2em;
  height: 1.2em;
  border: 1px solid currentColor;
  border-radius: 50%;
  font-family: var(--font-mono);
  font-size: 1em;
}
.card-art-slot {
  position: relative;
  display: block;
  flex: 1;
  min-height: 1em;
}
.card-art {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.card-resources {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.2em;
  min-height: 1em;
  flex-shrink: 0;
  font-family: var(--font-mono);
  font-size: 0.85em;
}
.card-resources > span {
  display: inline-flex;
  align-items: center;
  gap: 0.1em;
}
.card-resources svg {
  width: 1em;
  height: 1em;
}
.remaining-count {
  margin-left: auto;
}
.card-faction {
  flex-shrink: 0;
  font-size: 0.72em;
  line-height: 1.2;
  margin-block: 0.2em;
  overflow-wrap: anywhere;
}
.card-effects {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 0.15em;
  margin-block: 0.2em;
  font-size: 0.85em;
  line-height: 1.25;
  overflow-wrap: anywhere;
}
.card-effect + .card-effect {
  border-top: 1px solid var(--color-line);
  padding-top: 0.15em;
}
.card-effect strong {
  font-weight: 500;
}
.action-marker {
  position: absolute;
  right: 3px;
  top: 3px;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--color-accent);
}
.is-in-play .card-content {
  display: grid;
  grid-template-columns: minmax(0, 0.65fr) minmax(0, 1.35fr);
  grid-template-rows: auto auto 1fr auto;
  grid-template-areas:
    'heading heading'
    'faction faction'
    'art effects'
    'art resources';
  column-gap: 0.3em;
}
.is-in-play:has(.card-effect:nth-child(4)) .card-content {
  grid-template-columns: minmax(0, 1fr) 3em;
  grid-template-areas:
    'heading art'
    'faction art'
    'effects effects'
    'resources resources';
}
.is-in-play .card-heading {
  grid-area: heading;
}
.is-in-play .card-art-slot {
  grid-area: art;
}
.is-in-play .card-faction {
  grid-area: faction;
}
.is-in-play .card-effects {
  grid-area: effects;
  align-self: center;
  font-size: 0.8em;
}
.is-in-play .card-resources {
  grid-area: resources;
}
</style>
