<script setup lang="ts">
import { ref, useId } from 'vue';
import AppModal from '@/components/ui/AppModal.vue';
import AppInput from '@/components/ui/AppInput.vue';
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
</script>

<template>
  <AppModal
    v-model="isOpen"
    title="Create a game"
    description="Set the starting health for your next battle. Both players begin with the same HP."
    :dismissible="!isLoading"
  >
    <form
      :id="formId"
      novalidate
      :aria-busy="isLoading || undefined"
      @submit.prevent="submit"
    >
      <AppInput
        v-model="startingHp"
        name="startingHp"
        label="Starting HP"
        hint="1–500 HP. The standard game starts at 50."
        type="number"
        min="1"
        max="500"
        required
        autofocus
        :disabled="isLoading"
        rules="max_value:500|min_value:10|required"
        validationName="Starting hp"
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
        >Cancel</AppButton
      >
      <AppButton
        type="submit"
        :form="formId"
        :loading="isLoading"
      >
        {{ isLoading ? 'Creating game…' : 'Create game' }}
      </AppButton>
    </template>
  </AppModal>
</template>
