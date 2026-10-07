<script setup lang="ts">
import { useI18n } from '@/plugins/i18n';
import { ref, useId } from 'vue';
import AppModal from '@/components/ui/AppModal.vue';
import IntegerInput from '@/components/ui/IntegerInput.vue';
import AppButton from '@/components/ui/AppButton.vue';
import { useCreateGame } from '../useCreateGame';
import { useForm } from 'vee-validate';

const isOpen = defineModel<boolean>({ required: true });
const emit = defineEmits<{ created: [gameId: string] }>();
const startingHp = ref<string | number | null>(50);
const formId = `create-game-${useId()}`;
const { createGame, isLoading, error } = useCreateGame();
const { validate } = useForm();

const submit = async () => {
  if (isLoading.value) return;
  const { valid } = await validate();
  if (!valid) return;

  const game = await createGame({ startingHp: Number(startingHp.value) });
  if (game) {
    emit('created', game.id);
    isOpen.value = false;
  }
};

const { t } = useI18n();
</script>

<template>
  <AppModal
    v-model="isOpen"
    :title="t('lobby.createTitle')"
    :description="t('lobby.createDescription')"
    :dismissible="!isLoading"
  >
    <form
      :id="formId"
      novalidate
      :aria-busy="isLoading || undefined"
      @submit.prevent="submit"
    >
      <IntegerInput
        v-model="startingHp"
        name="startingHp"
        :label="t('lobby.startingHp')"
        :hint="t('lobby.hpHint')"
        required
        autofocus
        :disabled="isLoading"
        rules="integer|max_value:500|min_value:10|required"
        :validationName="t('lobby.hpValidation')"
      />
      <p
        v-if="error"
        role="alert"
        class="mt-4 rounded-control border border-danger/25 bg-danger/10 px-4 py-3 text-sm text-danger"
      >
        {{ error }}
      </p>
    </form>
    <template #actions>
      <AppButton
        variant="secondary"
        :disabled="isLoading"
        @click="isOpen = false"
        >{{ t('common.cancel') }}</AppButton
      >
      <AppButton
        type="submit"
        :form="formId"
        :loading="isLoading"
      >
        {{ t(isLoading ? 'lobby.creating' : 'lobby.create') }}
      </AppButton>
    </template>
  </AppModal>
</template>
