<script setup lang="ts">
import AppCard from '@/components/ui/AppCard.vue';

defineProps<{ title: string; tone: 'success' | 'accent' | 'warning' | 'danger' }>();

const toneClasses = {
  success: 'bg-success',
  accent: 'bg-accent',
  warning: 'bg-warning',
  danger: 'bg-danger'
} as const;
</script>

<template>
  <AppCard
    padding="sm"
    class="flex gap-3"
  >
    <span
      :class="toneClasses[tone]"
      class="mt-[0.4rem] size-2 shrink-0 rounded-full"
      aria-hidden="true"
    />
    <div>
      <h3 class="font-display font-semibold text-ink">{{ title }}</h3>
      <p class="mt-2 text-sm leading-6 text-ink-muted"><slot /></p>
    </div>
  </AppCard>
</template>
