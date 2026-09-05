<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink, type RouteLocationRaw } from 'vue-router';

import AppSpinner from './AppSpinner.vue';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface Props {
  variant?: ButtonVariant;
  size?: ButtonSize;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  loading?: boolean;
  block?: boolean;
  to?: RouteLocationRaw;
  href?: string;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
  disabled: false,
  loading: false,
  block: false
});

const emit = defineEmits<{ click: [event: MouseEvent] }>();
const isLink = computed(() => props.to != null || props.href != null);
const isDisabled = computed(() => props.disabled || props.loading);
const element = computed(() => {
  if (!isLink.value) return 'button';
  return props.to != null && !isDisabled.value ? RouterLink : 'a';
});
const elementAttrs = computed(() => {
  if (!isLink.value) return { type: props.type, disabled: isDisabled.value };
  if (props.to != null && !isDisabled.value) return { to: props.to };
  return { href: isDisabled.value ? undefined : props.href };
});

const handleClick = (event: MouseEvent) => {
  if (isDisabled.value) {
    event.preventDefault();
    event.stopPropagation();
    return;
  }
  emit('click', event);
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'border-accent bg-accent text-on-accent hover:border-accent-strong hover:bg-accent-strong',
  secondary: 'border-line bg-surface-raised text-ink hover:border-line-strong hover:bg-surface-hover',
  danger: 'border-danger bg-danger text-void hover:border-danger/80 hover:bg-danger/80',
  ghost: 'border-transparent bg-transparent text-ink-muted hover:bg-surface-hover hover:text-ink'
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'min-h-9 gap-1.5 px-3 text-xs',
  md: 'min-h-11 gap-2 px-4 text-sm',
  lg: 'min-h-12 gap-2.5 px-5 text-base'
};

const buttonClasses = computed(() => [
  'inline-flex items-center justify-center rounded-control border font-semibold',
  'transition-[color,background-color,border-color,box-shadow,transform] duration-200 ease-out-expo',
  'active:translate-y-px',
  isDisabled.value && 'pointer-events-none opacity-40',
  variantClasses[props.variant],
  sizeClasses[props.size],
  props.block && 'w-full'
]);
</script>

<template>
  <component
    :is="element"
    v-bind="elementAttrs"
    :role="isLink && isDisabled ? 'link' : undefined"
    :class="buttonClasses"
    :aria-disabled="isLink && isDisabled ? true : undefined"
    :tabindex="isLink && isDisabled ? -1 : undefined"
    :aria-busy="loading || undefined"
    @click="handleClick"
  >
    <AppSpinner
      v-if="loading"
      :size="size"
    />

    <slot name="leading" />
    <span><slot /></span>
    <slot name="trailing" />
  </component>
</template>
