<script setup lang="ts">
import { useI18n } from '@/plugins/i18n';
import RuleSection from '../RuleSection.vue';
import { rulesSections } from '../../rules-sections';
import RulePhase from '../RulePhase.vue';

const { t } = useI18n();
</script>

<template>
  <RuleSection :section="rulesSections.turn">
    <p class="text-base text-ink-muted [&_strong]:font-semibold [&_strong]:text-ink">
      {{ t('rules.turn.intro') }}
    </p>
    <div class="mt-6 space-y-3">
      <RulePhase
        number="1"
        :title="t('rules.turn.play')"
      >
        {{ t('rules.turn.playText') }}
      </RulePhase>
      <RulePhase
        number="2"
        :title="t('rules.turn.abilities')"
      >
        {{ t('rules.turn.abilitiesText') }}
      </RulePhase>
      <RulePhase
        number="3"
        :title="t('rules.turn.acquire')"
      >
        {{ t('rules.turn.acquireText') }}
      </RulePhase>
      <RulePhase
        number="4"
        :title="t('rules.turn.attack')"
      >
        {{ t('rules.turn.attackText') }}
      </RulePhase>
      <RulePhase
        number="5"
        :title="t('rules.turn.end')"
      >
        {{ t('rules.turn.endText') }}
      </RulePhase>
    </div>
  </RuleSection>
</template>
