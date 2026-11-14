<script setup lang="ts">
import { computed, onBeforeUnmount } from 'vue';
import { useI18n } from '@/plugins/i18n';
import IconGameResource from '@/components/icons/IconGameResource.vue';
import type { GameCard } from '../../game-types';
import type { StarfallActionDto } from '@/api/swagger/Starfall/data-contracts';
import { describeEffect, describeAbility, factionColors, factionNames } from '../../game-presentation';
import CardArt from './CardArt.vue';
const props = defineProps<{ card: GameCard; actionable?: boolean; market?: boolean; remaining?: number }>();
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
  // Keyboard activation opens immediately; pointer clicks wait so a dialog cannot intercept the second click.
  if (event.detail === 0) {
    cancelInspection();
    emit('inspect', props.card);
    return;
  }
  if (event.detail > 2) return;
  if (inspectionTimer !== undefined) {
    cancelInspection();
    emit('activate', props.card);
    return;
  }
  clickTarget = event.currentTarget as HTMLElement;
  document.addEventListener('pointerdown', cancelOutsideInspection, true);
  inspectionTimer = setTimeout(() => {
    cancelInspection();
    emit('inspect', props.card);
  }, DOUBLE_CLICK_DELAY);
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
    :class="[{ 'is-actionable': actionable, 'is-outpost': card.outpost }, factionColors[card.fraction]]"
    :aria-label="t('game.cardDetails', { name: card.name })"
    :title="`${card.name} · ${factionNames[card.fraction]} · ${t(`game.cardTypes.${card.outpost ? 'outpost' : card.type}`)}`"
    @click="handleClick"
    @dblclick.prevent
    @blur="cancelInspection"
    @keydown.esc="cancelInspection"
  >
    <span class="card-heading">
      <span class="card-name text-ink">{{ card.name }}</span>
      <span
        v-if="market"
        class="card-cost text-warning"
        :aria-label="t('game.cardCost', { count: card.cost })"
        >{{ card.cost }}</span
      >
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
        {{ t(`game.cardTypes.${card.type}`)
        }}<template v-if="card.outpost"> · {{ t('game.cardTypes.outpost') }}</template>
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
          >{{ effect.label }}: </strong
        >{{ describeCardEffect(effect.action) }}
      </span>
    </span>
    <span class="card-resources">
      <span
        v-if="card.money"
        class="text-warning"
        :aria-label="t('game.resources.trade', { count: card.money })"
        ><IconGameResource kind="trade" />{{ card.money }}</span
      >
      <span
        v-if="card.attack"
        class="text-danger"
        :aria-label="t('game.resources.combat', { count: card.attack })"
        ><IconGameResource kind="combat" />{{ card.attack }}</span
      >
      <span
        v-if="card.type === 'base'"
        class="text-ink"
        :aria-label="t('game.resources.defense', { count: card.currentDefense ?? card.health ?? 0 })"
        ><IconGameResource kind="defense" />{{ card.currentDefense ?? card.health ?? 0 }}</span
      >
      <span
        v-if="remaining !== undefined"
        class="remaining-count text-ink-muted"
        :title="t('game.remaining', { count: remaining })"
        :aria-label="t('game.remaining', { count: remaining })"
        ><IconGameResource kind="deck" />{{ remaining }}</span
      >
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
  position: relative;
  touch-action: manipulation;
  user-select: none;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 2.75rem;
  height: 100%;
  overflow: visible;
  border: 1px solid var(--color-line-strong);
  border-top: 2px solid currentColor;
  border-radius: 0.4rem;
  padding: 0.3rem;
  background: linear-gradient(155deg, var(--color-surface-raised), var(--color-canvas));
  text-align: left;
  box-shadow: 0 3px 8px rgb(0 0 0 / 0.35);
  transition:
    border-color 150ms,
    background-color 150ms,
    transform 150ms;
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
  gap: 0.2rem;
  min-height: 0;
  flex-shrink: 0;
}
.card-name {
  display: block;
  overflow-wrap: anywhere;
  font-size: clamp(0.625rem, 1vw, 0.85rem);
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
  font-size: clamp(0.65rem, 1.1vw, 0.9rem);
}
.card-art-slot {
  position: relative;
  display: block;
  flex: 1;
  min-height: 0.5rem;
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
  gap: 0.2rem;
  min-height: 0.8rem;
  flex-shrink: 0;
  font-family: var(--font-mono);
  font-size: clamp(0.6rem, 1vw, 0.85rem);
}
.card-resources > span {
  display: inline-flex;
  align-items: center;
  gap: 0.1rem;
}
.card-resources svg {
  width: 1em;
  height: 1em;
}
.remaining-count {
  margin-left: auto;
}
.card-faction {
  font-size: clamp(0.5rem, 0.8vw, 0.65rem);
  line-height: 1.2;
  margin-block: 0.15rem;
  overflow-wrap: anywhere;
}
.card-effects {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  margin-block: 0.2rem;
  font-size: clamp(0.625rem, 0.9vw, 0.75rem);
  line-height: 1.25;
  overflow-wrap: anywhere;
}
.card-effect + .card-effect {
  border-top: 1px solid var(--color-line);
  padding-top: 0.15rem;
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
@media (max-height: 500px) and (min-width: 700px) {
  .table-card {
    padding: 0.2rem;
  }
  .card-art-slot {
    min-height: 0;
  }
  .card-name {
    font-size: 0.625rem;
  }
  .card-faction {
    margin-block: 0.05rem;
  }
  .card-effects {
    margin-block: 0.05rem;
    gap: 0.1rem;
    font-size: 0.5625rem;
    line-height: 1.15;
  }
  .card-effect + .card-effect {
    padding-top: 0.05rem;
  }
}
</style>
