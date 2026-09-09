<script setup lang="ts">
import { ref, type VNode } from 'vue';
import AppButton from './AppButton.vue';

const props = withDefaults(defineProps<{ title: string; description?: string; dismissible?: boolean }>(), {
  dismissible: true
});

const isOpen = defineModel<boolean>({ default: false });
const startedOnBackdrop = ref(false);

const previousOverflow = ref('');

const openDialog = ({ el }: VNode) => {
  (el as HTMLDialogElement).showModal();
  previousOverflow.value = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
};

const closeDialog = ({ el }: VNode) => {
  (el as HTMLDialogElement).close();
  document.body.style.overflow = previousOverflow.value;
  startedOnBackdrop.value = false;
};

const isBackdrop = (event: MouseEvent) => {
  if (event.target !== event.currentTarget) return false;
  const bounds = (event.currentTarget as HTMLDialogElement).getBoundingClientRect();
  return (
    event.clientX < bounds.left ||
    event.clientX > bounds.right ||
    event.clientY < bounds.top ||
    event.clientY > bounds.bottom
  );
};

const requestClose = () => {
  if (props.dismissible) isOpen.value = false;
};

const handleBackdropClick = (event: MouseEvent) => {
  if (startedOnBackdrop.value && isBackdrop(event)) requestClose();
  startedOnBackdrop.value = false;
};
</script>

<template>
  <Teleport to="body">
    <dialog
      v-if="isOpen"
      class="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-card border border-line bg-surface p-6 text-ink shadow-2xl backdrop:bg-void/80 backdrop:backdrop-blur-sm sm:p-8"
      @cancel.prevent="requestClose"
      @vue:mounted="openDialog"
      @vue:before-unmount="closeDialog"
      @close="isOpen = false"
      @pointerdown="startedOnBackdrop = isBackdrop($event)"
      @click="handleBackdropClick"
    >
      <div class="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 class="font-display text-2xl font-semibold">
            {{ title }}
          </h2>
          <p
            v-if="description"
            class="mt-2 text-sm text-ink-muted"
          >
            {{ description }}
          </p>
        </div>
        <AppButton
          variant="ghost"
          size="sm"
          aria-label="Close dialog"
          :disabled="!dismissible"
          @click="requestClose"
        >
          <span
            aria-hidden="true"
            class="text-xl leading-none"
            >×</span
          >
        </AppButton>
      </div>
      <slot />
      <div
        v-if="$slots.actions"
        class="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"
      >
        <slot name="actions" />
      </div>
    </dialog>
  </Teleport>
</template>
