<script setup lang="ts">
import RuleSection from '../RuleSection.vue';
import { rulesSections } from '../../rules-sections';
import AppCard from '@/components/ui/AppCard.vue';
import AppButton from '@/components/ui/AppButton.vue';
const rows = [
  {
    label: 'Starting deck',
    value: '8 Scouts + 2 Vipers'
  },
  {
    label: 'Starting Authority',
    value: '50 in a standard match'
  },
  {
    label: 'Trade Row',
    value: '5 face-up cards, refilled immediately'
  },
  {
    label: 'Opening hands',
    value: 'First player: 3 cards · Second player: 5 cards'
  },
  {
    label: 'Normal hand',
    value: 'Draw 5 cards at the end of your turn'
  },
  {
    label: 'Unused resources',
    value: 'Trade and Combat reset at end of turn'
  },
  {
    label: 'Ships',
    value: 'Discard at end of turn'
  },
  {
    label: 'Bases',
    value: 'Remain in play until destroyed or removed'
  },
  {
    label: 'Outposts',
    value: 'Must be destroyed before other enemy targets'
  },
  {
    label: 'Victory',
    value: 'Enemy Authority reaches 0'
  }
];
</script>

<template>
  <RuleSection :section="rulesSections.reference">
    <AppCard
      padding="none"
      class="overflow-x-auto"
    >
      <table class="w-full min-w-136 border-collapse text-left text-sm">
        <tbody class="divide-y divide-line">
          <tr
            v-for="row in rows"
            :key="row.label"
            class="odd:bg-surface/80"
          >
            <th
              scope="row"
              class="w-2/5 px-4 py-3.5 font-semibold text-ink"
            >
              {{ row.label }}
            </th>
            <td class="px-4 py-3.5 text-ink-muted">{{ row.value }}</td>
          </tr>
        </tbody>
      </table>
    </AppCard>

    <div class="mt-8 flex flex-wrap gap-3">
      <AppButton :to="{ name: 'games' }"> Find a game → </AppButton>
      <AppButton
        :to="{ name: 'home' }"
        variant="secondary"
      >
        Return home
      </AppButton>
    </div>
  </RuleSection>
</template>
