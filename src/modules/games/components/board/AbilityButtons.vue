<script setup lang="ts">
import { useI18n } from '@/plugins/i18n';
import AppButton from '@/components/ui/AppButton.vue';
import { describeEffect, describeAbility } from '../../game-presentation';
import type { GameAction, GameCard } from '../../game-types';
defineProps<{ card: GameCard; disabled: boolean }>();
defineEmits<{ action: [action: GameAction] }>();

const { t } = useI18n();
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
        {{ describeAbility(ability) }}
      </p>
      <AppButton
        v-else
        block
        variant="secondary"
        :disabled="disabled || !ability.isAvailable"
        :title="describeEffect(ability.action)"
        @click="$emit('action', { type: 'use_ability', payload: { cardId: card.id, abilityId: ability.id } })"
      >
        {{
          t('game.abilities.action', {
            ability: describeAbility(ability, true),
            effect: describeEffect(ability.action)
          })
        }}
      </AppButton>
    </div>
  </div>
</template>
