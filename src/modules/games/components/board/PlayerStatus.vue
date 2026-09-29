<script setup lang="ts">
import type { StarfallPlayerViewDto } from '@/api/swagger/Starfall/data-contracts';
import AppButton from '@/components/ui/AppButton.vue';
defineProps<{ player: StarfallPlayerViewDto; active: boolean; own?: boolean }>();
defineEmits<{ discard: [] }>();
</script>
<template>
  <div
    class="flex flex-wrap items-center justify-between gap-4 rounded-panel border p-4"
    :class="active ? 'border-accent/60 bg-accent-soft/20' : 'border-line bg-surface'"
  >
    <div>
      <p class="text-xs uppercase tracking-widest text-ink-muted">{{ own ? 'Your fleet' : 'Opponent' }}</p>
      <h2 class="mt-1 font-display text-lg font-semibold">
        {{ player.username }}
        <span
          v-if="active"
          class="ml-2 text-xs text-accent"
        >
          Active turn
        </span>
      </h2>
    </div>
    <dl class="flex flex-wrap gap-x-5 gap-y-2 text-xs">
      <div>
        <dt class="text-ink-muted">Authority</dt>
        <dd class="font-mono text-xl text-success">{{ player.hp }}</dd>
      </div>
      <div>
        <dt class="text-ink-muted">Trade</dt>
        <dd class="font-mono text-xl text-warning">{{ player.money }}</dd>
      </div>
      <div>
        <dt class="text-ink-muted">Combat</dt>
        <dd class="font-mono text-xl text-danger">{{ player.attack }}</dd>
      </div>
      <div>
        <dt class="text-ink-muted">Deck</dt>
        <dd class="font-mono text-xl">{{ player.deckCount }}</dd>
      </div>
      <div>
        <dt class="text-ink-muted">Hand</dt>
        <dd class="font-mono text-xl">{{ player.handCount }}</dd>
      </div>
    </dl>
    <AppButton
      variant="ghost"
      @click="$emit('discard')"
    >
      Discard ({{ player.discard.length }})
    </AppButton>
  </div>
</template>
