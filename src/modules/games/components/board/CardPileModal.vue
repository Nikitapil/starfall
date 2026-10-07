<script setup lang="ts">
import { useI18n } from '@/plugins/i18n';
import AppModal from '@/components/ui/AppModal.vue';
import type { GameCard } from '../../game-types';
import { factionNames } from '../../game-presentation';
import AppButton from '@/components/ui/AppButton.vue';

defineProps<{ title: string; cards: GameCard[]; dismissible: boolean }>();
defineEmits<{ close: []; inspect: [card: GameCard] }>();

const { t } = useI18n();
</script>

<template>
  <AppModal
    :model-value="true"
    :title="title"
    :dismissible="dismissible"
    @update:model-value="$emit('close')"
  >
    <p
      v-if="!cards.length"
      class="text-sm text-ink-muted"
    >
      {{ t('game.emptyPile') }}
    </p>
    <ul class="space-y-2">
      <li
        v-for="card in cards"
        :key="card.id"
      >
        <AppButton
          variant="secondary"
          class="justify-start"
          block
          @click="$emit('inspect', card)"
        >
          {{ card.name }} <span class="text-xs text-ink-muted">· {{ factionNames[card.fraction] }}</span>
        </AppButton>
      </li>
    </ul>
  </AppModal>
</template>
