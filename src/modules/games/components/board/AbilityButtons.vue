<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue';
import { describeEffect } from '../../game-presentation';
import type { GameAction, GameCard } from '../../game-types';
defineProps<{ card: GameCard; disabled: boolean }>();
defineEmits<{ action: [action: GameAction] }>();
</script>
<template>
  <div class="space-y-2">
    <div
      v-for="ability in card.abilityStates"
      :key="ability.id"
    >
      <p
        v-if="ability.isUsed"
        class="px-1 text-xs text-ink-faint"
      >
        {{ ability.kind === 'primary' ? 'Primary' : ability.kind === 'ally' ? 'Ally' : 'Scrap' }} · Used
      </p>
      <AppButton
        v-else
        block
        variant="secondary"
        :disabled="disabled || !ability.isAvailable"
        :title="describeEffect(ability.action)"
        @click="$emit('action', { type: 'use_ability', payload: { cardId: card.id, abilityId: ability.id } })"
      >
        {{ ability.id.startsWith('copied:') ? 'Copied ' : ''
        }}{{ ability.kind === 'primary' ? 'Activate' : ability.kind === 'ally' ? 'Ally' : 'Scrap' }}:
        {{ describeEffect(ability.action) }}
      </AppButton>
    </div>
  </div>
</template>
