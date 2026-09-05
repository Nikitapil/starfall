<script setup lang="ts">
import RuleSection from '../RuleSection.vue';
import { rulesSections } from '../../rules-sections';
import RulePhase from '../RulePhase.vue';
</script>

<template>
  <RuleSection :section="rulesSections.turn">
    <p class="text-base text-ink-muted [&_strong]:font-semibold [&_strong]:text-ink">
      You may perform the actions below in any useful order unless a card or pending choice says otherwise. You can play
      a card, buy a card, resolve an ability, then continue playing. The interface tracks available Trade and Combat for
      you.
    </p>
    <div class="mt-6 space-y-3">
      <RulePhase
        number="1"
        title="Play cards"
      >
        Play any or all Ships from your hand face up. Bases already under your control remain in play. Drawn cards may
        also be played this turn.
      </RulePhase>
      <RulePhase
        number="2"
        title="Use abilities"
      >
        Gain resources from primary abilities, trigger Ally abilities when their condition is met, and make any required
        choices. Optional abilities may be skipped.
      </RulePhase>
      <RulePhase
        number="3"
        title="Acquire cards"
      >
        Spend Trade equal to a card’s cost. Acquired cards normally enter your discard pile and cannot be played
        immediately. Replace a purchased Trade Row card at once. Explorers remain available while their supply lasts.
      </RulePhase>
      <RulePhase
        number="4"
        title="Attack"
      >
        Spend Combat against enemy Bases or the opposing player. Outposts must be destroyed before you can attack other
        targets that they protect.
      </RulePhase>
      <RulePhase
        number="5"
        title="End the turn"
      >
        Discard every Ship you played and every card left in your hand. Set unused Trade and Combat to zero, then draw a
        new hand of five cards. Bases remain in play.
      </RulePhase>
    </div>
  </RuleSection>
</template>
