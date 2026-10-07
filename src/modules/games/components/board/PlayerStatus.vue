<script setup lang="ts">
import { useI18n } from '@/plugins/i18n';
import type { StarfallPlayerViewDto } from '@/api/swagger/Starfall/data-contracts';
import AppButton from '@/components/ui/AppButton.vue';
defineProps<{ player: StarfallPlayerViewDto; active: boolean; own?: boolean }>();
defineEmits<{ discard: [] }>();

const { t } = useI18n();
</script>
<template>
  <div
    class="flex flex-wrap items-center justify-between gap-4 rounded-panel border p-4"
    :class="active ? 'border-accent/60 bg-accent-soft/20' : 'border-line bg-surface'"
  >
    <div>
      <p class="text-xs uppercase tracking-widest text-ink-muted">{{ t(own ? 'game.yourFleet' : 'game.opponent') }}</p>
      <h2 class="mt-1 font-display text-lg font-semibold">
        {{ player.username }}
        <span
          v-if="active"
          class="ml-2 text-xs text-accent"
        >
          {{ t('game.activeTurn') }}
        </span>
      </h2>
    </div>
    <dl class="flex flex-wrap gap-x-5 gap-y-2 text-xs">
      <div>
        <dt class="text-ink-muted">{{ t('game.terms.authority') }}</dt>
        <dd class="font-mono text-xl text-success">{{ player.hp }}</dd>
      </div>
      <div>
        <dt class="text-ink-muted">{{ t('game.terms.trade') }}</dt>
        <dd class="font-mono text-xl text-warning">{{ player.money }}</dd>
      </div>
      <div>
        <dt class="text-ink-muted">{{ t('game.terms.combat') }}</dt>
        <dd class="font-mono text-xl text-danger">{{ player.attack }}</dd>
      </div>
      <div>
        <dt class="text-ink-muted">{{ t('game.terms.deck') }}</dt>
        <dd class="font-mono text-xl">{{ player.deckCount }}</dd>
      </div>
      <div>
        <dt class="text-ink-muted">{{ t('game.terms.hand') }}</dt>
        <dd class="font-mono text-xl">{{ player.handCount }}</dd>
      </div>
    </dl>
    <AppButton
      variant="ghost"
      @click="$emit('discard')"
    >
      {{ t('game.discardCount', { count: player.discard.length }) }}
    </AppButton>
  </div>
</template>
