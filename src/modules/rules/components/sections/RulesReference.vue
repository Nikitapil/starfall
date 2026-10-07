<script setup lang="ts">
import { useI18n } from '@/plugins/i18n';
import RuleSection from '../RuleSection.vue';
import { rulesSections } from '../../rules-sections';
import AppCard from '@/components/ui/AppCard.vue';
import AppButton from '@/components/ui/AppButton.vue';
const rows = [
  {
    label: 'rules.reference.deck',
    value: 'rules.reference.deckValue'
  },
  {
    label: 'rules.reference.authority',
    value: 'rules.reference.authorityValue'
  },
  {
    label: 'rules.reference.trade',
    value: 'rules.reference.tradeValue'
  },
  {
    label: 'rules.reference.opening',
    value: 'rules.reference.openingValue'
  },
  {
    label: 'rules.reference.hand',
    value: 'rules.reference.handValue'
  },
  {
    label: 'rules.reference.resources',
    value: 'rules.reference.resourcesValue'
  },
  {
    label: 'rules.reference.ships',
    value: 'rules.reference.shipsValue'
  },
  {
    label: 'rules.reference.bases',
    value: 'rules.reference.basesValue'
  },
  {
    label: 'rules.reference.outposts',
    value: 'rules.reference.outpostsValue'
  },
  {
    label: 'rules.reference.victory',
    value: 'rules.reference.victoryValue'
  }
];

const { t } = useI18n();
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
              {{ t(row.label) }}
            </th>
            <td class="px-4 py-3.5 text-ink-muted">{{ t(row.value) }}</td>
          </tr>
        </tbody>
      </table>
    </AppCard>

    <div class="mt-8 flex flex-wrap gap-3">
      <AppButton :to="{ name: 'games' }"> {{ t('rules.findGame') }} </AppButton>
      <AppButton
        :to="{ name: 'home' }"
        variant="secondary"
      >
        {{ t('rules.home') }}
      </AppButton>
    </div>
  </RuleSection>
</template>
