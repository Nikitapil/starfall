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
    >
      <IconGameResource kind="authority" />
      {{ player.hp }}
    </span>
    <div class="player-piles text-ink-muted">
      <span
        :title="t('game.terms.deck')"
        :aria-label="`${t('game.terms.deck')}: ${player.deckCount}`"
      >
        <IconGameResource kind="deck" />
        {{ player.deckCount }}
      </span>
      <span
        :title="t('game.terms.hand')"
        :aria-label="`${t('game.terms.hand')}: ${player.handCount}`"
      >
        <IconGameResource kind="hand" />{{ player.handCount }}
      </span>
      <AppButton
        class="discard-button"
        variant="ghost"
        :aria-label="t('game.discardCount', { count: player.discard.length })"
        :title="t('game.discardCount', { count: player.discard.length })"
        @click="$emit('discard')"
      >
        <template #leading><IconGameResource kind="discard" /></template>
        {{ player.discard.length }}
      </AppButton>
    </div>
    <div
      v-if="!own"
      class="opponent-resources"
    >
      <span
        class="text-warning"
        :aria-label="t('game.resources.trade', { count: player.money })"
      >
        <IconGameResource kind="trade" />{{ player.money }}
      </span>
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
  display: grid;
  grid-template-columns: 3.2em minmax(0, 1fr);
  gap: 0.15em 0.5em;
  align-content: center;
  align-items: center;
  min-width: 0;
}
.player-identity {
  grid-column: 2;
  display: flex;
  align-items: center;
  gap: 0.3em;
  min-width: 0;
}
.player-identity h2 {
  font-size: 0.85em;
}
.turn-light {
  width: 0.35em;
  height: 0.35em;
  border-radius: 50%;
  flex: none;
}
.authority {
  position: relative;
  grid-column: 1;
  grid-row: 1 / 4;
  display: grid;
  place-items: center;
  width: 1.6em;
  height: 2em;
  font: 700 2em var(--font-mono);
}
.authority svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0.35;
}
.player-piles,
.opponent-resources {
  grid-column: 2;
  display: flex;
  align-items: center;
  gap: 0.5em;
  font: 0.75em var(--font-mono);
}
.player-piles > span {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15em;
}
.opponent-resources > span {
  display: inline-flex;
  align-items: center;
  gap: 0.2em;
}
.player-piles svg,
.opponent-resources svg {
  width: 1.2em;
  height: 1.2em;
}
.discard-button {
  min-width: 2.75rem;
  min-height: 2.75rem;
  padding-inline: 0.2em;
  gap: 0.2em;
  font: inherit;
}
@media (orientation: portrait) and (max-width: 699px) {
  .player-status {
    grid-template-columns: minmax(0, 1fr);
    justify-items: center;
  }
  .player-identity,
  .authority,
  .player-piles,
  .opponent-resources {
    grid-column: 1;
    grid-row: auto;
  }
  .authority {
    grid-row: 1;
    height: 1.2em;
    font-size: 1.5em;
  }
  .player-piles {
    flex-wrap: wrap;
    justify-content: center;
  }
}
</style>
