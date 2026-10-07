<script setup lang="ts">
import { useI18n } from '@/plugins/i18n';
import AppModal from '@/components/ui/AppModal.vue';
import AppButton from '@/components/ui/AppButton.vue';

defineProps<{ title: string; message: string; loading: boolean; disabled: boolean }>();
defineEmits<{ close: []; confirm: [] }>();

const { t } = useI18n();
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
        {{ t('common.cancel') }}
      </AppButton>
      <AppButton
        :disabled="disabled"
        :loading="loading"
        @click="$emit('confirm')"
      >
        {{ t('common.confirm') }}
      </AppButton>
    </template>
  </AppModal>
</template>
