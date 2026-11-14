<script setup lang="ts">
import { useI18n } from '@/plugins/i18n';
import type { StarfallPlayerViewDto } from '@/api/swagger/Starfall/data-contracts';
import AppButton from '@/components/ui/AppButton.vue';
import IconGameResource from '@/components/icons/IconGameResource.vue';
defineProps<{ player: StarfallPlayerViewDto; active: boolean; own?: boolean }>();
defineEmits<{ discard: [] }>();
const { t } = useI18n();
</script>
<template>
  <section
    class="player-status"
    :class="{ 'is-active': active }"
    :aria-label="t(own ? 'game.yourFleet' : 'game.opponent')"
  >
    <div class="player-identity">
      <span
        class="turn-light"
        :class="active ? 'bg-accent' : 'bg-line'"
        :aria-label="active ? t('game.activeTurn') : undefined"
      />
      <h2
        class="truncate text-xs font-semibold"
        :title="player.username"
      >
        {{ player.username }}
      </h2>
    </div>
    <span
      class="authority text-success"
      :title="t('game.terms.authority')"
      :aria-label="t('game.resources.authority', { count: player.hp })"
      ><IconGameResource kind="authority" />{{ player.hp }}</span
    >
    <div class="player-piles text-ink-muted">
      <span
        :title="t('game.terms.deck')"
        :aria-label="`${t('game.terms.deck')}: ${player.deckCount}`"
        ><IconGameResource kind="deck" />{{ player.deckCount }}</span
      >
      <span
        :title="t('game.terms.hand')"
        :aria-label="`${t('game.terms.hand')}: ${player.handCount}`"
        ><IconGameResource kind="hand" />{{ player.handCount }}</span
      >
      <AppButton
        class="discard-button"
        variant="ghost"
        :aria-label="t('game.discardCount', { count: player.discard.length })"
        :title="t('game.discardCount', { count: player.discard.length })"
        @click="$emit('discard')"
        ><template #leading><IconGameResource kind="discard" /></template>{{ player.discard.length }}</AppButton
      >
    </div>
    <div
      v-if="!own"
      class="opponent-resources"
    >
      <span
        class="text-warning"
        :aria-label="t('game.resources.trade', { count: player.money })"
        ><IconGameResource kind="trade" />{{ player.money }}</span
      >
      <span
        class="text-danger"
        :aria-label="t('game.resources.combat', { count: player.attack })"
        ><IconGameResource kind="combat" />{{ player.attack }}</span
      >
    </div>
  </section>
</template>
<style scoped>
.player-status {
  display: flex;
  flex-wrap: nowrap;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 0.25rem 0.5rem;
  min-width: 0;
}
.player-identity {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  min-width: 0;
  max-width: 100%;
  flex: none;
}
.turn-light {
  width: 0.3rem;
  height: 0.3rem;
  border-radius: 50%;
  flex-shrink: 0;
}
.authority {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  font: 700 1.4rem var(--font-mono);
}
.authority svg {
  width: 1.3rem;
  height: 1.3rem;
}
.player-piles,
.opponent-resources {
  display: flex;
  align-items: center;
  gap: 0.15rem;
  flex-wrap: wrap;
  justify-content: center;
  font: 0.6rem var(--font-mono);
}
.player-piles > span,
.opponent-resources > span {
  display: inline-flex;
  align-items: center;
  gap: 0.15rem;
}
.player-piles svg,
.opponent-resources svg {
  width: 0.75rem;
  height: 0.75rem;
}
.discard-button {
  padding-inline: 0.2rem;
  gap: 0.15rem;
  font: 0.6rem var(--font-mono);
}
@media (min-width: 700px) {
  .player-status {
    flex-direction: column;
    flex-wrap: nowrap;
    justify-content: center;
    align-items: center;
  }
  .player-identity {
    flex: none;
  }
  .authority {
    font-size: 2rem;
  }
  .authority svg {
    width: 1.6rem;
    height: 1.6rem;
  }
}
@media (max-width: 699px) {
  .player-status {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 0.1rem;
    align-content: center;
  }
  .player-identity h2 {
    font-size: 0.6rem;
  }
  .authority {
    font-size: 1.1rem;
    gap: 0.1rem;
  }
  .authority svg {
    width: 0.8rem;
    height: 0.8rem;
  }
  .player-piles,
  .opponent-resources {
    grid-column: 1 / -1;
  }
}
@media (max-height: 500px) and (min-width: 700px) {
  .player-status {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 0 0.15rem;
    align-content: center;
  }
  .player-identity {
    grid-row: 1;
    grid-column: 1;
  }
  .authority {
    grid-row: 1;
    grid-column: 2;
    font-size: 1.2rem;
  }
  .authority svg {
    width: 1rem;
    height: 1rem;
  }
  .player-piles {
    grid-row: 2;
    grid-column: 1;
    gap: 0.1rem;
    font-size: 0.6rem;
  }
  .opponent-resources {
    grid-row: 2;
    grid-column: 2;
    gap: 0.1rem;
    font-size: 0.6rem;
  }
  .player-piles svg,
  .opponent-resources svg {
    width: 0.65rem;
    height: 0.65rem;
  }
  .discard-button {
    font-size: 0.6rem;
  }
}
</style>
