<script setup lang="ts">
import type { GameCard } from '../../game-types';
import { describeEffect, factionColors, factionNames } from '../../game-presentation';
import CardArt from './CardArt.vue';
defineProps<{ card: GameCard; selected?: boolean }>();
defineEmits<{ inspect: [card: GameCard] }>();
</script>
<template>
  <article
    class="flex w-48 shrink-0 flex-col overflow-hidden rounded-card border bg-surface-raised transition-colors"
    :class="selected ? 'border-accent shadow-glow' : 'border-line'"
  >
    <div
      type="button"
      class="flex w-full flex-1 flex-col p-3 text-left hover:bg-surface-hover cursor-pointer"
      :aria-label="`View ${card.name} details`"
      @click="$emit('inspect', card)"
    >
      <div class="flex items-start gap-2">
        <span
          class="grid size-8 shrink-0 place-items-center rounded-control border border-warning/30 font-mono text-warning"
          :aria-label="`${card.cost} Trade cost`"
          >{{ card.cost }}</span
        >
        <h3 class="min-h-10 text-sm font-semibold leading-5">{{ card.name }}</h3>
      </div>
      <div :class="factionColors[card.fraction]">
        <CardArt
          :type="card.type"
          :outpost="card.outpost"
        />
        <p class="text-[11px] font-semibold">
          {{ factionNames[card.fraction] }} · {{ card.outpost ? 'Outpost' : card.type === 'base' ? 'Base' : 'Ship' }}
        </p>
      </div>
      <div class="mt-2 flex flex-wrap gap-x-3 gap-y-1 font-mono text-xs">
        <span
          v-if="card.money"
          class="text-warning"
        >
          +{{ card.money }} Trade
        </span>
        <span
          v-if="card.attack"
          class="text-danger"
        >
          +{{ card.attack }} Combat
        </span>
        <span v-if="card.type === 'base'">{{ card.currentDefense ?? card.health }} Defense</span>
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
        Copied ship abilities
      </p>
      <p
        v-if="card.matchAbilities.length || card.removeAbility || card.persistentAbilities.length"
        class="mt-2 text-[11px] text-ink-muted"
      >
        {{
          [
            card.matchAbilities.length ? 'Ally' : '',
            card.removeAbility ? 'Scrap' : '',
            card.persistentAbilities.length ? 'Persistent' : ''
          ]
            .filter(Boolean)
            .join(' · ')
        }}
        — view details
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
