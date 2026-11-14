<script setup lang="ts">
import { useI18n } from '@/plugins/i18n';
import AppModal from '@/components/ui/AppModal.vue';
import { describeAbility } from '../../game-presentation';
import type { GameCard } from '../../game-types';
import { describeEffect, factionColors, factionNames } from '../../game-presentation';
import CardArt from './CardArt.vue';

defineProps<{ card: GameCard; dismissible: boolean }>();
defineEmits<{ close: [] }>();

const { t } = useI18n();
</script>

<template>
  <AppModal
    :model-value="true"
    :title="card.name"
    :dismissible="dismissible"
    @update:model-value="$emit('close')"
  >
    <CardArt
      :type="card.type"
      :fraction="card.fraction"
      :outpost="card.outpost"
      :class="factionColors[card.fraction]"
    />
    <p class="mt-3 text-sm text-ink-muted">
      {{
        t('game.cardSummary', {
          faction: factionNames[card.fraction],
          type: t(`game.cardTypes.${card.outpost ? 'outpost' : card.type}`),
          cost: card.cost
        })
      }}
    </p>
    <p class="mt-3 font-mono text-sm">
      {{ t('game.resources.trade', { count: card.money }) }} · {{ t('game.resources.combat', { count: card.attack })
      }}<span v-if="card.type === 'base'">
        · {{ t('game.resources.defense', { count: card.currentDefense ?? card.health ?? 0 }) }}</span
      >
    </p>
    <div
      v-for="(effect, index) in card.abilities"
      :key="`primary-${index}`"
      class="mt-3 text-sm"
    >
      <p class="text-xs font-semibold text-accent">{{ t('game.abilities.primary') }}</p>
      <p>{{ describeEffect(effect) }}</p>
    </div>
    <div
      v-for="(effect, index) in card.matchAbilities"
      :key="`ally-${index}`"
      class="mt-3 text-sm"
    >
      <p class="text-xs font-semibold text-accent">{{ t('game.abilities.ally') }}</p>
      <p>{{ describeEffect(effect) }}</p>
    </div>
    <div
      v-if="card.removeAbility"
      class="mt-3 text-sm"
    >
      <p class="text-xs font-semibold text-accent">{{ t('game.abilities.scrap') }}</p>
      <p>{{ describeEffect(card.removeAbility) }}</p>
    </div>
    <div
      v-for="ability in card.abilityStates"
      :key="ability.id"
      class="mt-4 rounded-control border border-line p-3"
    >
      <p class="text-xs font-semibold uppercase text-accent">
        {{ describeAbility(ability) }}
      </p>
      <p class="mt-1 text-sm">{{ describeEffect(ability.action) }}</p>
    </div>
    <div
      v-for="(ability, index) in card.persistentAbilities"
      :key="index"
      class="mt-4 rounded-control border border-line p-3"
    >
      <p class="text-xs font-semibold uppercase text-accent">{{ t('game.abilities.onShip') }}</p>
      <p class="mt-1 text-sm">{{ describeEffect(ability.action) }}</p>
    </div>
    <template
      v-if="$slots.actions"
      #actions
      ><slot name="actions"
    /></template>
  </AppModal>
</template>
