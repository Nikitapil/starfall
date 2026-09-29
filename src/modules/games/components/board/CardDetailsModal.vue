<script setup lang="ts">
import AppModal from '@/components/ui/AppModal.vue';
import type { GameCard } from '../../game-types';
import { describeEffect, factionColors, factionNames } from '../../game-presentation';
import CardArt from './CardArt.vue';

defineProps<{ card: GameCard; dismissible: boolean }>();
defineEmits<{ close: [] }>();
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
      :outpost="card.outpost"
      :class="factionColors[card.fraction]"
    />
    <p class="mt-3 text-sm text-ink-muted">
      {{ factionNames[card.fraction] }} · {{ card.outpost ? 'Outpost' : card.type }} · Cost {{ card.cost }}
    </p>
    <p class="mt-3 font-mono text-sm">
      {{ card.money }} Trade · {{ card.attack }} Combat<span v-if="card.type === 'base'">
        · {{ card.currentDefense ?? card.health }} Defense</span
      >
    </p>
    <div
      v-for="ability in card.abilityStates"
      :key="ability.id"
      class="mt-4 rounded-control border border-line p-3"
    >
      <p class="text-xs font-semibold uppercase text-accent">
        {{ ability.id.startsWith('copied:') ? 'Copied ' : '' }}{{ ability.kind }}{{ ability.isUsed ? ' · Used' : '' }}
      </p>
      <p class="mt-1 text-sm">{{ describeEffect(ability.action) }}</p>
    </div>
    <div
      v-for="(ability, index) in card.persistentAbilities"
      :key="index"
      class="mt-4 rounded-control border border-line p-3"
    >
      <p class="text-xs font-semibold uppercase text-accent">Whenever you play a ship</p>
      <p class="mt-1 text-sm">{{ describeEffect(ability.action) }}</p>
    </div>
  </AppModal>
</template>
