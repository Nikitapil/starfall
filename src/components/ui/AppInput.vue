<script setup lang="ts">
import { computed, useAttrs, useId } from 'vue';

import AppSpinner from './AppSpinner.vue';
import { useField } from 'vee-validate';
import type { AppInputProps, InputSize, InputValue } from './AppInput.types';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<AppInputProps>(), {
  id: undefined,
  label: undefined,
  hint: undefined,
  error: undefined,
  size: 'md',
  loading: false,
  inputClass: undefined
});

const model = defineModel<InputValue>({ default: '' });
const attrs = useAttrs();
const generatedId = useId();

const { errorMessage, handleBlur, validate } = useField(props.name, props.rules, {
  validateOnMount: false,
  validateOnValueUpdate: false,
  syncVModel: true,
  label: props.validationName
});

const handleChange = () => {
  if (errorMessage.value) {
    validate();
  }
};

const error = computed(() => errorMessage.value || props.error);

const inputId = computed(() => props.id ?? `app-input-${generatedId}`);
const messageId = computed(() => `${inputId.value}-${error.value ? 'error' : 'hint'}`);
const describedBy = computed(() => {
  if (error.value || props.hint) return messageId.value;

  return typeof attrs['aria-describedby'] === 'string' ? attrs['aria-describedby'] : undefined;
});

const inputAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => key !== 'class' && key !== 'style'))
);

const sizeClasses: Record<InputSize, string> = {
  sm: 'min-h-9 px-3 text-xs',
  md: 'min-h-11 px-3 text-sm',
  lg: 'min-h-12 px-4 text-base'
};

const inputClasses = computed(() => [
  'w-full rounded-control border bg-canvas text-ink placeholder:text-ink-faint',
  'transition-[color,background-color,border-color,box-shadow] duration-200 ease-out-expo',
  'hover:border-line-strong focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
  error.value ? 'border-danger focus:border-danger' : 'border-line focus:border-accent',
  sizeClasses[props.size],
  props.inputClass
]);
</script>

<template>
  <div :class="['grid gap-1.5', attrs.class]">
    <label
      v-if="label"
      :for="inputId"
      class="text-sm font-medium text-ink"
    >
      {{ label }}
    </label>

    <div class="relative">
      <div
        v-if="$slots.leading || loading"
        class="pointer-events-none absolute inset-y-0 left-3 flex items-center"
        :class="loading ? 'text-accent' : 'text-ink-muted'"
      >
        <AppSpinner
          v-if="loading"
          :size="size"
        />
        <slot
          v-else
          name="leading"
        />
      </div>

      <input
        :id="inputId"
        v-model="model"
        v-bind="inputAttrs"
        :name="name"
        :disabled="disabled || loading"
        :class="[inputClasses, { 'pl-10': $slots.leading || loading, 'pr-10': $slots.trailing }]"
        :aria-invalid="error ? true : undefined"
        :aria-describedby="describedBy"
        :aria-busy="loading || undefined"
        @input="handleChange"
        @blur="handleBlur($event, true)"
      />

      <div
        v-if="$slots.trailing"
        class="absolute inset-y-0 right-3 flex items-center text-ink-muted"
      >
        <slot name="trailing" />
      </div>
    </div>

    <p
      v-if="error || hint"
      :id="messageId"
      class="text-xs"
      :class="error ? 'text-danger' : 'text-ink-muted'"
      :role="error ? 'alert' : undefined"
    >
      {{ error || hint }}
    </p>
  </div>
</template>
