<script setup lang="ts">
import { computed } from 'vue';

type CardVariant = 'default' | 'panel' | 'raised' | 'accent' | 'danger';
type CardPadding = 'none' | 'sm' | 'md' | 'lg';

interface Props {
  as?: keyof HTMLElementTagNameMap;
  variant?: CardVariant;
  padding?: CardPadding;
  interactive?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  as: 'div',
  variant: 'default',
  padding: 'md',
  interactive: false
});

const variantClasses: Record<CardVariant, string> = {
  default: 'border-line bg-surface/80',
  panel: 'border-line bg-surface shadow-panel',
  raised: 'border-line bg-surface-raised',
  accent: 'border-accent/20 bg-accent-soft/40',
  danger: 'border-danger/25 bg-danger/5'
};

const paddingClasses: Record<CardPadding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8'
};

const cardClasses = computed(() => [
  'rounded-card border',
  variantClasses[props.variant],
  paddingClasses[props.padding],
  props.interactive &&
    'transition duration-200 ease-out-expo hover:border-line-strong hover:bg-surface-raised'
]);
</script>

<template>
  <component
    :is="as"
    :class="cardClasses"
  >
    <slot />
  </component>
</template>
