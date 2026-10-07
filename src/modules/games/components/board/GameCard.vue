<script setup lang="ts">
import { useI18n } from '@/plugins/i18n';
import type { GameCard } from '../../game-types';
import { describeEffect, factionColors, factionNames } from '../../game-presentation';
import CardArt from './CardArt.vue';
defineProps<{ card: GameCard; selected?: boolean }>();
defineEmits<{ inspect: [card: GameCard] }>();

const { t } = useI18n();
</script>
<template>
  <article
    class="flex w-48 shrink-0 flex-col overflow-hidden rounded-card border bg-surface-raised transition-colors"
    :class="selected ? 'border-accent shadow-glow' : 'border-line'"
  >
    <div
      type="button"
      class="flex w-full flex-1 flex-col p-3 text-left hover:bg-surface-hover cursor-pointer"
      :aria-label="t('game.cardDetails', { name: card.name })"
      @click="$emit('inspect', card)"
    >
      <div class="flex items-start gap-2">
        <span
          class="grid size-8 shrink-0 place-items-center rounded-control border border-warning/30 font-mono text-warning"
          :aria-label="t('game.cardCost', { count: card.cost })"
        >
          {{ card.cost }}
        </span>
        <h3 class="min-h-10 text-sm font-semibold leading-5">{{ card.name }}</h3>
      </div>
      <div :class="factionColors[card.fraction]">
        <CardArt
          :type="card.type"
          :outpost="card.outpost"
        />
        <p class="text-[11px] font-semibold">
          {{ factionNames[card.fraction] }} · {{ t(`game.cardTypes.${card.outpost ? 'outpost' : card.type}`) }}
        </p>
      </div>
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
        v-for="(effect, index) in card.abilities"
        :key="index"
        class="mt-2 text-xs leading-5 text-ink-muted"
      >
        {{ describeEffect(effect) }}
      </p>
      <p
        v-if="card.copiedCardId"
        class="mt-2 text-xs text-accent"
      >
        {{ t('game.copiedShip') }}
      </p>
      <p
        v-if="card.matchAbilities.length || card.removeAbility || card.persistentAbilities.length"
        class="mt-2 text-[11px] text-ink-muted"
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
    </div>
    <div
      v-if="$slots.default"
      class="space-y-2 border-t border-line p-2"
    >
      <slot />
    </div>
  </article>
</template>
