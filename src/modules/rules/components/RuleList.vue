<script setup lang="ts">
withDefaults(defineProps<{ ordered?: boolean }>(), { ordered: false });
</script>

<template>
  <component
    :is="ordered ? 'ol' : 'ul'"
    :class="ordered ? 'list-decimal' : 'list-disc'"
    class="rule-list grid gap-3 pl-5 text-sm leading-6 text-ink-muted"
  >
    <slot />
  </component>
</template>

<style scoped>
.rule-list :deep(li::marker) {
  color: var(--color-accent);
}
.rule-list :deep(strong) {
  color: var(--color-ink);
  font-weight: 600;
}
</style>
