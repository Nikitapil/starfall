<script setup lang="ts">
import AppCard from '@/components/ui/AppCard.vue';

defineProps<{ title: string }>();
</script>

<template>
  <AppCard padding="sm">
    <slot name="symbol" />
    <h3
      :class="{ 'mt-4': $slots.symbol }"
      class="font-display text-lg font-semibold text-ink"
    >
      {{ title }}
    </h3>
    <p class="mt-2 text-sm text-ink-muted"><slot /></p>
  </AppCard>
</template>
