<script setup lang="ts">
defineProps<{
  title: string;
  eyebrow?: string;
  description?: string;
}>();
</script>

<template>
  <header class="flex w-full flex-col gap-6 border-b border-line pb-8 sm:flex-row sm:items-center sm:justify-between">
    <div class="min-w-0 max-w-3xl">
      <p
        v-if="eyebrow"
        class="font-mono text-xs uppercase tracking-[0.18em] text-accent"
      >
        {{ eyebrow }}
      </p>
      <h1
        :class="{ 'mt-3': eyebrow }"
        class="font-display text-4xl font-semibold text-ink sm:text-5xl"
      >
        {{ title }}
      </h1>
      <p
        v-if="description"
        class="mt-3 text-base text-ink-muted"
      >
        {{ description }}
      </p>
    </div>
    <div
      v-if="$slots.actions"
      class="flex flex-col gap-3 sm:shrink-0 sm:flex-row sm:items-center"
    >
      <slot name="actions" />
    </div>
  </header>
</template>
