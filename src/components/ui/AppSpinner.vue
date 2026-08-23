<script setup lang="ts">
import { computed } from 'vue';

type SpinnerSize = 'sm' | 'md' | 'lg';

interface Props {
  size?: SpinnerSize;
  label?: string;
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  label: undefined
});

const sizeClasses: Record<SpinnerSize, string> = {
  sm: 'size-3.5',
  md: 'size-4',
  lg: 'size-6'
};

const spinnerClasses = computed(() => ['shrink-0 animate-spin', sizeClasses[props.size]]);
</script>

<template>
  <span
    :role="label ? 'status' : undefined"
    :aria-label="label"
    :aria-hidden="label ? undefined : true"
    class="inline-flex"
  >
    <svg
      :class="spinnerClasses"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        class="opacity-25"
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        stroke-width="3"
      />
      <path
        class="opacity-90"
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        stroke-width="3"
        stroke-linecap="round"
      />
    </svg>
  </span>
</template>
