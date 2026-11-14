<script setup lang="ts">
import { useI18n } from '@/plugins/i18n';
import type { GameCard } from '../../game-types';
import { describeEffect, factionColors, factionNames } from '../../game-presentation';
import CardArt from './CardArt.vue';
defineProps<{ card: GameCard; selected?: boolean; compact?: boolean; horizontal?: boolean }>();
defineEmits<{ inspect: [card: GameCard] }>();

const { t } = useI18n();
</script>
<template>
  <article
    class="game-card relative flex shrink-0 overflow-hidden rounded-control border bg-surface-raised transition-colors"
    :class="[
      selected ? 'border-accent shadow-glow' : 'border-line',
      horizontal ? 'w-64 flex-row' : compact ? 'w-32 flex-col' : 'w-36 flex-col'
    ]"
  >
    <button
      type="button"
      class="flex min-w-0 w-full flex-1 flex-col p-2 text-left hover:bg-surface-hover cursor-pointer"
      :aria-label="t('game.cardDetails', { name: card.name })"
      @click="$emit('inspect', card)"
    >
      <div class="flex items-start gap-2">
        <span
          class="grid size-6 shrink-0 place-items-center rounded-control border border-warning/30 font-mono text-warning"
          :aria-label="t('game.cardCost', { count: card.cost })"
        >
          {{ card.cost }}
        </span>
        <h3
          class="line-clamp-2 min-h-8 break-words text-xs font-semibold leading-4"
          :title="card.name"
        >
          {{ card.name }}
        </h3>
      </div>
      <div
        v-if="!compact"
        :class="factionColors[card.fraction]"
      >
        <CardArt
          :type="card.type"
          :fraction="card.fraction"
          :outpost="card.outpost"
          class="!h-16"
        />
        <p class="text-[11px] font-semibold">
          {{ factionNames[card.fraction] }}
        </p>
      </div>
      <p class="text-[11px] font-semibold text-ink-muted">
        {{ t(`game.cardTypes.${card.type}`)
        }}<template v-if="card.outpost"> · {{ t('game.cardTypes.outpost') }}</template>
      </p>
      <div class="mt-2 flex flex-wrap gap-x-3 gap-y-1 font-mono text-xs">
        <span
          v-if="card.money"
          class="text-warning"
        >
          +{{ t('game.resources.trade', { count: card.money }) }}
        </span>
        <span
          v-if="card.attack"
          class="text-danger"
        >
          +{{ t('game.resources.combat', { count: card.attack }) }}
        </span>
        <span v-if="card.type === 'base'">{{
          t('game.resources.defense', { count: card.currentDefense ?? card.health ?? 0 })
        }}</span>
      </div>
      <p
        v-if="!compact && card.abilities.length"
        class="mt-1 line-clamp-2 text-xs leading-4 text-ink-muted"
      >
        {{ card.abilities.map(describeEffect).join(' · ') }}
      </p>
      <p
        v-if="card.copiedCardId"
        class="mt-2 text-xs text-accent"
      >
        {{ t('game.copiedShip') }}
      </p>
      <p
        v-if="!compact && (card.matchAbilities.length || card.removeAbility || card.persistentAbilities.length)"
        class="mt-1 text-[11px] text-ink-muted"
      >
        {{
          t('game.abilityDetails', {
            abilities: [
              card.matchAbilities.length ? t('game.abilities.ally') : '',
              card.removeAbility ? t('game.abilities.scrap') : '',
              card.persistentAbilities.length ? t('game.abilities.persistent') : ''
            ]
              .filter(Boolean)
              .join(' · ')
          })
        }}
      </p>
      <span class="sr-only">{{ t('game.board.details') }}</span>
    </button>
    <div
      v-if="$slots.default"
      class="space-y-1 border-line p-1"
      :class="horizontal ? 'flex w-28 shrink-0 flex-col justify-center border-l' : 'border-t'"
    >
      <slot />
    </div>
  </article>
</template>

<style scoped>
.game-card :deep(button) {
  overflow-wrap: anywhere;
}
.game-card :deep(.min-h-11) {
  padding-inline: 0.375rem;
  font-size: 0.75rem;
}
</style>
