<script setup lang="ts">
import { useI18n } from '@/plugins/i18n';
import { computed, ref, watch } from 'vue';
import AppButton from '@/components/ui/AppButton.vue';
import GameCard from './GameCard.vue';
import type { GameAction, GameCard as Card, GameView } from '../../game-types';
import { describeEffects, pendingChoices } from '../../game-presentation';

const props = defineProps<{ game: GameView; playerId: string; disabled: boolean; loading: boolean }>();
const emit = defineEmits<{ action: [action: GameAction]; inspect: [card: Card] }>();
const choices = computed(() => pendingChoices(props.game, props.playerId));
const selected = ref<string[]>([]);
const option = ref<number | null>(null);
const isEffect = computed(() => props.game.pendingAction?.type === 'choose_effect');
watch(
  () => props.game.version,
  () => {
    selected.value = [];
    option.value = null;
  }
);
const valid = computed(() => {
  if (isEffect.value) {
    return option.value !== null && !!props.game.pendingAction?.options?.[option.value];
  }
  return !!choices.value && selected.value.length >= choices.value.min && selected.value.length <= choices.value.max;
});
const toggle = (id: string) => {
  if (props.disabled || !choices.value) {
    return;
  }
  if (selected.value.includes(id)) {
    selected.value = selected.value.filter((value) => value !== id);
  } else if (!choices.value.multiple) {
    selected.value = [id];
  } else if (selected.value.length < choices.value.max) {
    selected.value = [...selected.value, id];
  }
};
const confirm = () => {
  if (!valid.value || props.disabled) {
    return;
  }
  emit('action', {
    type: 'resolve_pending',
    payload: isEffect.value
      ? { optionIndex: option.value ?? 0 }
      : choices.value?.multiple
        ? { cardIds: selected.value }
        : { cardId: selected.value[0] }
  });
};

const { t } = useI18n();
</script>
<template>
  <section
    v-if="choices"
    class="min-w-0 rounded-panel border border-accent bg-accent-soft/30 p-4 sm:p-5"
    aria-labelledby="pending-title"
  >
    <p class="text-xs font-semibold uppercase tracking-widest text-accent">{{ t('game.choices.required') }}</p>
    <h2
      id="pending-title"
      class="mt-1 text-lg font-semibold"
      aria-live="polite"
    >
      {{ choices.title }}
    </h2>
    <p
      v-if="!isEffect"
      class="mt-2 text-sm text-ink-muted"
    >
      {{
        t(
          'game.choices.selection',
          {
            range: choices.min === choices.max ? choices.min : `${choices.min}–${choices.max}`,
            selected: selected.length
          },
          choices.max
        )
      }}
    </p>
    <div
      v-if="isEffect"
      class="mt-4 grid gap-3"
      role="group"
      :aria-label="t('game.choices.options')"
    >
      <AppButton
        v-for="(effects, index) in game.pendingAction?.options"
        :key="index"
        :variant="option === index ? 'primary' : 'secondary'"
        block
        type="button"
        :disabled="disabled"
        :aria-pressed="option === index"
        @click="option = index"
      >
        {{ describeEffects(effects) }}
      </AppButton>
    </div>
    <div
      v-else
      class="mt-4 flex gap-3 overflow-x-auto pb-3"
    >
      <GameCard
        v-for="{ card, zone } in choices.cards"
        :key="card.id"
        :card="card"
        :selected="selected.includes(card.id)"
        @inspect="$emit('inspect', $event)"
      >
        <p class="text-center text-xs text-ink-muted">{{ zone }}</p>
        <AppButton
          block
          variant="secondary"
          :aria-pressed="selected.includes(card.id)"
          :disabled="disabled || (choices.multiple && !selected.includes(card.id) && selected.length >= choices.max)"
          @click="toggle(card.id)"
        >
          {{ t(selected.includes(card.id) ? 'game.choices.remove' : 'game.choices.select') }}
        </AppButton>
      </GameCard>
      <p
        v-if="!choices.cards.length"
        class="text-sm text-ink-muted"
      >
        {{ t('game.choices.empty') }}
      </p>
    </div>
    <div class="mt-4 flex flex-wrap gap-3">
      <AppButton
        :disabled="disabled || !valid"
        :loading="loading"
        @click="confirm"
      >
        {{ t('game.choices.confirm') }}
      </AppButton>
      <AppButton
        v-if="choices.canCancel"
        variant="secondary"
        :disabled="disabled"
        @click="emit('action', { type: 'cancel_pending', payload: {} })"
      >
        {{ t('game.choices.skip') }}
      </AppButton>
    </div>
  </section>
</template>
