<script setup lang="ts">
import { useI18n } from '@/plugins/i18n';
import type { GameCard as Card } from '../../game-types';
import GameCard from './GameCard.vue';
defineProps<{
  title: string;
  cards: Card[];
  empty?: string;
  compact?: boolean;
  horizontal?: boolean;
}>();
defineEmits<{ inspect: [card: Card] }>();

const { t } = useI18n();
</script>
<template>
  <section
    class="min-w-0"
    :aria-label="title"
  >
    <div class="mb-1 flex items-center justify-between gap-3">
      <h2 class="text-xs font-semibold uppercase tracking-widest text-ink-muted">{{ title }}</h2>
      <span class="font-mono text-xs text-ink-muted">{{ cards.length }}</span>
    </div>
    <div
      v-if="cards.length"
      class="flex gap-2 overflow-x-auto pb-1 pt-1"
    >
      <GameCard
        v-for="card in cards"
        :key="card.id"
        :card="card"
        :compact="compact"
        :horizontal="horizontal"
        @inspect="$emit('inspect', $event)"
      >
        <template
          v-if="$slots.default"
          #default
          ><slot
            :card="card"
            :compact="compact"
            :horizontal="horizontal"
        /></template>
      </GameCard>
    </div>
    <p
      v-else
      class="rounded-panel border border-dashed border-line px-3 py-2 text-sm text-ink-faint"
    >
      {{ empty ?? t('game.emptyZone') }}
    </p>
  </section>
</template>
