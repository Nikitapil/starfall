<script setup lang="ts">
import type { GameCard as Card } from '../../game-types';
import GameCard from './GameCard.vue';
defineProps<{ title: string; cards: Card[]; empty?: string }>();
defineEmits<{ inspect: [card: Card] }>();
</script>
<template>
  <section
    class="min-w-0"
    :aria-label="title"
  >
    <div class="mb-3 flex items-center justify-between gap-3">
      <h2 class="text-xs font-semibold uppercase tracking-widest text-ink-muted">{{ title }}</h2>
      <span class="font-mono text-xs text-ink-muted">{{ cards.length }}</span>
    </div>
    <div
      v-if="cards.length"
      class="flex gap-3 overflow-x-auto pb-3 pt-1"
    >
      <GameCard
        v-for="card in cards"
        :key="card.id"
        :card="card"
        @inspect="$emit('inspect', $event)"
      >
        <template
          v-if="$slots.default"
          #default
          ><slot :card="card"
        /></template>
      </GameCard>
    </div>
    <p
      v-else
      class="rounded-panel border border-dashed border-line px-4 py-6 text-sm text-ink-faint"
    >
      {{ empty ?? 'No cards here yet.' }}
    </p>
  </section>
</template>
