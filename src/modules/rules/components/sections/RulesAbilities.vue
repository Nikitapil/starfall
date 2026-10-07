<script setup lang="ts">
import { useI18n } from '@/plugins/i18n';
import RuleSection from '../RuleSection.vue';
import { rulesSections } from '../../rules-sections';
import AppCard from '@/components/ui/AppCard.vue';
const definitions = [
  {
    term: 'rules.abilities.primary',
    description: 'rules.abilities.primaryText'
  },
  {
    term: 'rules.abilities.ally',
    description: 'rules.abilities.allyText'
  },
  {
    term: 'rules.abilities.scrap',
    description: 'rules.abilities.scrapText'
  },
  {
    term: 'rules.abilities.choices',
    description: 'rules.abilities.choicesText'
  }
];

const { t } = useI18n();
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
        <dt class="font-display font-semibold text-ink">{{ t(definition.term) }}</dt>
        <dd class="text-sm leading-6 text-ink-muted">{{ t(definition.description) }}</dd>
      </div>
    </AppCard>

    <div class="mt-6 border-l-2 border-warning bg-warning/6 p-4 text-sm leading-6 text-ink-muted">
      <i18n-t
        keypath="rules.abilities.warning"
        tag="span"
        scope="global"
      >
        <template #emphasis>
          <strong class="font-semibold text-ink">{{ t('rules.abilities.warningEmphasis') }}</strong>
        </template>
      </i18n-t>
    </div>
  </RuleSection>
</template>
