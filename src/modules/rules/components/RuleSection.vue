<script setup lang="ts">
import type { RuleSectionInfo } from '../rules-sections';

defineProps<{ section: RuleSectionInfo }>();
</script>

<template>
  <section
    :id="section.id"
    class="scroll-mt-24"
  >
    <div class="mb-5 flex items-center gap-3">
      <span class="font-mono text-xs text-accent">// {{ section.number }}</span>
      <h2 class="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{{ section.title }}</h2>
    </div>
    <slot />
  </section>
</template>
