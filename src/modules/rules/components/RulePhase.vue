<script setup lang="ts">
import AppCard from '@/components/ui/AppCard.vue';

defineProps<{ number: string; title: string }>();
</script>

<template>
  <AppCard
    padding="sm"
    class="flex gap-4"
  >
    <span class="grid size-8 shrink-0 place-items-center rounded-full bg-accent-soft font-mono text-xs text-accent">{{
      number
    }}</span>
    <div>
      <h3 class="font-display text-lg font-semibold text-ink">{{ title }}</h3>
      <p class="mt-1 text-sm leading-6 text-ink-muted"><slot /></p>
    </div>
  </AppCard>
</template>
