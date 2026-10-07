<script setup lang="ts">
import { useI18n } from '@/plugins/i18n';
import type { RuleSectionInfo } from '../rules-sections';

defineProps<{ section: RuleSectionInfo }>();

const { t } = useI18n();
</script>

<template>
  <section
    :id="section.id"
    class="scroll-mt-24"
  >
    <div class="mb-5 flex items-center gap-3">
      <span class="font-mono text-xs text-accent">// {{ section.number }}</span>
      <h2 class="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{{ t(section.title) }}</h2>
    </div>
    <slot />
  </section>
</template>
