<script setup lang="ts">
import AppModal from '@/components/ui/AppModal.vue';
import AppButton from '@/components/ui/AppButton.vue';

defineProps<{ title: string; message: string; loading: boolean; disabled: boolean }>();
defineEmits<{ close: []; confirm: [] }>();
</script>

<template>
  <AppModal
    :model-value="true"
    :title="title"
    :dismissible="!loading"
    @update:model-value="$emit('close')"
  >
    <p class="text-sm leading-6 text-ink-muted">{{ message }}</p>
    <template #actions>
      <AppButton
        variant="secondary"
        :disabled="loading"
        @click="$emit('close')"
      >
        Cancel
      </AppButton>
      <AppButton
        :disabled="disabled"
        :loading="loading"
        @click="$emit('confirm')"
      >
        Confirm
      </AppButton>
    </template>
  </AppModal>
</template>
