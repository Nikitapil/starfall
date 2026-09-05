<script setup lang="ts">
import RuleSection from '../RuleSection.vue';
import { rulesSections } from '../../rules-sections';
import AppCard from '@/components/ui/AppCard.vue';
const definitions = [
  {
    term: 'Primary ability',
    description:
      'The main effect of a Ship when played or of a Base on your turn. Resolve every listed effect unless it is explicitly optional.'
  },
  {
    term: 'Ally ability',
    description:
      'Activates when another card of the same faction is in play on your side. Play order does not matter: if a second matching card arrives later, eligible Ally abilities become available. Each ability is used at most once per turn.'
  },
  {
    term: 'Scrap ability',
    description:
      'Remove that card from play to gain its Scrap effect. You may use its primary and Ally abilities first, then Scrap it. The card does not enter your discard pile at the end of the turn.'
  },
  {
    term: 'Choices and targets',
    description:
      'Some abilities ask you to choose a card, a Base, or one of several effects. Resolve the pending choice before continuing. If an effect is marked optional, you may cancel it.'
  }
];
</script>

<template>
  <RuleSection :section="rulesSections.abilities">
    <AppCard
      as="dl"
      padding="none"
      class="overflow-hidden"
    >
      <div
        v-for="definition in definitions"
        :key="definition.term"
        class="grid gap-2 border-b border-line p-4 last:border-b-0 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-6"
      >
        <dt class="font-display font-semibold text-ink">{{ definition.term }}</dt>
        <dd class="text-sm leading-6 text-ink-muted">{{ definition.description }}</dd>
      </div>
    </AppCard>

    <div class="mt-6 border-l-2 border-warning bg-warning/6 p-4 text-sm leading-6 text-ink-muted">
      <strong class="font-semibold text-ink">Important:</strong> scrapping a card from your hand or discard pile does
      not activate that card’s printed Scrap ability. A Scrap ability only triggers when you use it from a card you
      control in play.
    </div>
  </RuleSection>
</template>
