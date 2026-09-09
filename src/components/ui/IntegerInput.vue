<script setup lang="ts">
import AppInput from './AppInput.vue';
import type { AppInputProps, InputValue } from './AppInput.types';

defineOptions({ inheritAttrs: false });

const props = defineProps<AppInputProps>();
const model = defineModel<InputValue>({ default: '' });

const restrictInput = (event: InputEvent) => {
  if (event.data && !/^-?\d*$/.test(event.data)) event.preventDefault();
};

const restrictPaste = (event: ClipboardEvent) => {
  const text = event.clipboardData?.getData('text');
  if (text && !/^-?\d+$/.test(text)) event.preventDefault();
};
</script>

<template>
  <AppInput
    v-bind="{ ...props, ...$attrs }"
    v-model="model"
    type="number"
    inputmode="numeric"
    step="1"
    @beforeinput="restrictInput"
    @paste="restrictPaste"
  >
    <template
      v-for="(_, name) in $slots"
      #[name]="slotProps"
    >
      <slot
        :name="name"
        v-bind="slotProps"
      />
    </template>
  </AppInput>
</template>
