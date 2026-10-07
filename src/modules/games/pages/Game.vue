<script setup lang="ts">
import { useI18n } from '@/plugins/i18n';
import { computed, onMounted, onUnmounted, shallowRef } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/modules/auth/useAuth';
import AppButton from '@/components/ui/AppButton.vue';
import AppCard from '@/components/ui/AppCard.vue';
import StarfallLoader from '@/components/ui/StarfallLoader.vue';
import { useGame } from '../useGame';
import type { GameAction, GameCard as Card } from '../game-types';
import { canAttackBase } from '../game-presentation';
import CardZone from '../components/board/CardZone.vue';
import GameCard from '../components/board/GameCard.vue';
import AbilityButtons from '../components/board/AbilityButtons.vue';
import PendingActionPanel from '../components/board/PendingActionPanel.vue';
import PlayerStatus from '../components/board/PlayerStatus.vue';
import CardDetailsModal from '../components/board/CardDetailsModal.vue';
import CardPileModal from '../components/board/CardPileModal.vue';
import ConfirmActionModal from '../components/board/ConfirmActionModal.vue';
import { StarfallAbilityStateDtoKindEnum } from '@/api/swagger/Starfall/data-contracts.ts';

const route = useRoute();
const auth = useAuthStore();
const gameId = computed(() => String(route.params.gameId ?? ''));
const playerId = computed(() => (auth.user ? String(auth.user.id) : ''));
const {
  game,
  lobby,
  me,
  opponent,
  isMyTurn,
  canAct,
  canSend,
  canJoin,
  isLoading,
  isSending,
  error,
  commandError,
  uncertainCommand,
  refresh,
  join,
  act,
  retryCommand,
  init,
  clear
} = useGame(gameId, playerId);
onMounted(init);
onUnmounted(clear);
const protectedByOutpost = computed(() => opponent.value?.bases.some((card) => card.outpost));
const canAttackPlayer = computed(() => canAct.value && !protectedByOutpost.value && (me.value?.attack ?? 0) > 0);
const myCardsInPlay = computed(() => [...(me.value?.bases ?? []), ...(me.value?.playedShips ?? [])]);
const allCards = computed(() =>
  game.value
    ? [
        ...game.value.tradeRow,
        ...(game.value.explorer ? [game.value.explorer] : []),
        ...game.value.scrappedCards,
        ...game.value.players.flatMap((p) => [...(p.hand ?? []), ...p.bases, ...p.playedShips, ...p.discard])
      ]
    : []
);
const selectedCard = shallowRef<Card | null>(null);
const selectedPile = shallowRef<{ ownerName: string; ownerId?: string } | null>(null);
const confirmation = shallowRef<{
  titleKey: string;
  messageKey: string;
  params?: { name: string };
  action: GameAction;
  version: number;
} | null>(null);
const inspectedCard = computed(() => {
  const card = selectedCard.value;
  return card ? (allCards.value.find((candidate) => candidate.id === card.id) ?? card) : null;
});

const isWaitingLobby = computed(() => lobby.value?.status === 'waiting' && lobby.value?.players.length < 2);
const isWinner = computed(() => game.value?.winnerId === playerId.value);

const pileCards = computed(() => {
  const pile = selectedPile.value;
  if (!pile) return [];
  return pile.ownerId
    ? (game.value?.players.find((player) => player.id === pile.ownerId)?.discard ?? [])
    : (game.value?.scrappedCards ?? []);
});
const inspect = (card: Card) => {
  selectedPile.value = null;
  selectedCard.value = card;
};
const showDiscard = (ownerId: string, name: string) => {
  selectedPile.value = { ownerId, ownerName: name };
};
const hasUnusedOptions = computed(
  () =>
    !!me.value &&
    ((me.value.hand?.length ?? 0) > 0 ||
      me.value.attack > 0 ||
      [...(game.value?.tradeRow ?? []), ...(game.value?.explorer ? [game.value.explorer] : [])].some(
        (c) => c.cost <= me.value!.money
      ) ||
      myCardsInPlay.value.some((card) =>
        card.abilityStates.some((a) => a.isAvailable && a.kind !== StarfallAbilityStateDtoKindEnum.Scrap)
      ))
);
const requestAction = (action: GameAction) => {
  if (!game.value) {
    return;
  }
  if (action.type === 'use_ability') {
    const card = myCardsInPlay.value.find((c) => c.id === action.payload.cardId);
    if (card?.abilityStates.find((a) => a.id === action.payload.abilityId)?.kind === 'scrap') {
      confirmation.value = {
        titleKey: 'game.confirmation.scrapTitle',
        params: { name: card.name },
        messageKey: 'game.confirmation.scrapText',
        action,
        version: game.value.version
      };
      return;
    }
  }
  if (action.type === 'end_turn' && hasUnusedOptions.value) {
    confirmation.value = {
      titleKey: 'game.confirmation.endTitle',
      messageKey: 'game.confirmation.endText',
      action,
      version: game.value.version
    };
    return;
  }
  act(action);
};
const confirmAction = async () => {
  if (!confirmation.value || confirmation.value.version !== game.value?.version || !canAct.value) return;
  const action = confirmation.value.action;
  await act(action);
  confirmation.value = null;
};

const { t } = useI18n();
</script>

<template>
  <section class="min-w-0 w-full py-6 pb-60 sm:py-8 sm:pb-32">
    <div
      v-if="isLoading"
      class="grid min-h-80 place-items-center"
    >
      <StarfallLoader :label="t('game.loading')" />
    </div>
    <template v-else>
      <AppCard
        v-if="error"
        variant="danger"
        class="mb-5"
      >
        <p role="alert">{{ error }}</p>
        <AppButton
          class="mt-3"
          variant="secondary"
          :disabled="isSending"
          @click="refresh"
        >
          {{ t('common.retry') }}
        </AppButton>
      </AppCard>
      <AppCard
        v-if="commandError"
        class="mb-5"
        variant="danger"
      >
        <p role="alert">{{ commandError }}</p>
        <AppButton
          v-if="uncertainCommand"
          class="mt-3"
          variant="secondary"
          :loading="isSending"
          @click="retryCommand"
        >
          {{ t('game.retryAction') }}
        </AppButton>
      </AppCard>

      <AppCard
        v-if="!game && lobby"
        class="mx-auto max-w-xl text-center"
        variant="panel"
      >
        <p class="text-xs uppercase text-accent">{{ t('game.name', { id: lobby.id.slice(0, 8) }) }}</p>
        <h2 class="mt-3 text-2xl font-semibold">
          {{ t(isWaitingLobby ? 'game.seat' : 'game.unavailable') }}
        </h2>
        <p class="mt-4 text-ink-muted">{{ lobby.players.map((p) => p.username).join(' · ') }}</p>
        <p class="mt-2 text-sm text-ink-muted">
          {{ t('game.lobbySummary', { hp: lobby.startingHp, players: lobby.players.length }) }}
        </p>
        <p
          v-if="isWaitingLobby"
          class="mt-4 text-sm text-ink-muted"
        >
          {{ t('game.joiningHint') }}
        </p>
        <p
          v-else
          class="mt-4 text-sm text-ink-muted"
        >
          {{ t('game.participantsOnly') }}
        </p>
        <AppButton
          v-if="isWaitingLobby"
          class="mt-6"
          :disabled="!canJoin"
          :loading="isSending"
          @click="join"
        >
          {{ t('game.join') }}
        </AppButton>
      </AppCard>

      <AppCard
        v-if="game?.status === 'waiting'"
        class="mx-auto max-w-xl text-center"
        variant="panel"
      >
        <h2 class="mt-4 text-2xl font-semibold">{{ t('game.waiting') }}</h2>
        <p class="mt-3 text-sm leading-6 text-ink-muted">
          {{ t('game.invite') }}
        </p>
        <p class="mt-5 text-sm text-ink-muted">
          {{ t('game.waitingSummary', { hp: game.startingHp }) }}
        </p>
      </AppCard>

      <div
        v-if="game && game.status !== 'waiting' && me && opponent"
        class="min-w-0 space-y-6"
      >
        <AppCard
          v-if="game.status === 'finished'"
          variant="accent"
          class="text-center"
          role="status"
        >
          <h2 class="font-display text-3xl font-semibold">{{ t(isWinner ? 'game.victory' : 'game.defeat') }}</h2>
          <AppButton
            class="mt-4"
            :to="{ name: 'games' }"
          >
            {{ t('game.back') }}
          </AppButton>
        </AppCard>

        <PlayerStatus
          :player="opponent"
          :active="game.status === 'active' && !isMyTurn"
          @discard="showDiscard(opponent.id, opponent.username)"
        />
        <div class="grid min-w-0 gap-6 xl:grid-cols-2">
          <CardZone
            :title="t('game.enemyBases')"
            :cards="opponent.bases"
            :empty="t('game.noEnemyBases')"
            @inspect="inspect"
          >
            <template #default="{ card }">
              <AppButton
                v-if="game.status === 'active'"
                block
                variant="secondary"
                :disabled="!canAct || !canAttackBase(game, playerId, card)"
                @click="requestAction({ type: 'attack_base', payload: { cardId: card.id } })"
              >
                {{ t('game.attackBase', { count: card.currentDefense ?? card.health ?? 0 }) }}
              </AppButton>
            </template>
          </CardZone>
          <CardZone
            :title="t('game.enemyShips')"
            :cards="opponent.playedShips"
            @inspect="inspect"
          />
        </div>
        <section class="min-w-0 rounded-panel border border-line bg-surface/70 p-4 sm:p-5">
          <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div class="flex flex-wrap gap-2 items-center">
              <h2 class="font-display text-lg font-semibold">{{ t('game.tradeSector') }}</h2>
              <p
                v-if="me.nextShipToTop"
                class="text-xs text-ink-muted"
              >
                {{ t('game.nextShipHint') }}
              </p>
            </div>
            <span class="text-xs text-ink-muted">{{
              t('game.tradeDeckCount', { count: game.unusedTradeDeckCount })
            }}</span>
          </div>
          <div class="flex min-w-0 gap-5 overflow-x-auto pb-2">
            <div class="flex gap-3">
              <GameCard
                v-for="card in game.tradeRow"
                :key="card.id"
                :card="card"
                @inspect="inspect"
              >
                <AppButton
                  block
                  variant="secondary"
                  :disabled="!canAct || me.money < card.cost"
                  @click="requestAction({ type: 'buy_card', payload: { cardId: card.id } })"
                >
                  {{ t('game.buy', { count: card.cost }) }}
                </AppButton>
              </GameCard>
              <p
                v-if="!game.tradeRow.length"
                class="py-8 text-sm text-ink-muted"
              >
                {{ t('game.tradeEmpty') }}
              </p>
            </div>
            <div class="shrink-0 border-l border-line pl-5">
              <GameCard
                v-if="game.explorer"
                class="h-full"
                :card="game.explorer"
                @inspect="inspect"
              >
                <p class="text-center text-xs text-ink-muted">
                  {{ t('game.remaining', { count: game.explorersCount }) }}
                </p>
                <AppButton
                  block
                  variant="secondary"
                  :disabled="!canAct || me.money < game.explorer.cost"
                  @click="requestAction({ type: 'buy_card', payload: { cardId: game.explorer.id } })"
                >
                  {{ t('game.buyExplorer', { name: game.explorer.name, cost: game.explorer.cost }) }}
                </AppButton>
              </GameCard>
              <p
                v-else
                class="w-48 py-8 text-sm text-ink-muted"
              >
                {{ t('game.explorersEmpty') }}
              </p>
            </div>
          </div>
        </section>
        <PlayerStatus
          :player="me"
          :active="isMyTurn"
          own
          @discard="showDiscard(me.id, me.username)"
        />

        <PendingActionPanel
          v-if="game.pendingAction?.playerId === playerId"
          :game="game"
          :playerId="playerId"
          :disabled="!canSend"
          :loading="isSending"
          @action="requestAction"
          @inspect="inspect"
        />
        <div class="grid min-w-0 gap-6 xl:grid-cols-2">
          <CardZone
            :title="t('game.yourBases')"
            :cards="me.bases"
            @inspect="inspect"
          >
            <template #default="{ card }">
              <AbilityButtons
                v-if="card.abilityStates.length"
                :card="card"
                :disabled="!canAct"
                @action="requestAction"
              />
            </template>
          </CardZone>
          <CardZone
            :title="t('game.yourShips')"
            :cards="me.playedShips"
            @inspect="inspect"
          >
            <template #default="{ card }">
              <AbilityButtons
                v-if="card.abilityStates.length"
                :card="card"
                :disabled="!canAct"
                @action="requestAction"
              />
            </template>
          </CardZone>
        </div>
        <CardZone
          :title="t('game.yourHand')"
          :cards="me.hand ?? []"
          :empty="t('game.emptyHand')"
          @inspect="inspect"
        >
          <template #default="{ card }">
            <AppButton
              block
              :disabled="!canAct"
              @click="requestAction({ type: 'play_card', payload: { cardId: card.id } })"
            >
              {{ t(card.type === 'ship' ? 'game.playShip' : 'game.playBase') }}
            </AppButton>
          </template>
        </CardZone>

        <div
          v-if="game.status === 'active'"
          class="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur-sm"
        >
          <div class="container mx-auto flex flex-wrap items-center justify-between gap-3">
            <div>
              <p
                class="text-sm font-semibold"
                role="status"
              >
                {{ t(game.pendingAction ? 'game.resolve' : isMyTurn ? 'game.yourTurn' : 'game.opponentTurn') }}
              </p>
              <p class="mt-1 font-mono text-xs">
                <span class="text-warning">{{ t('game.resources.trade', { count: me.money }) }}</span> ·
                <span class="text-danger">{{ t('game.resources.combat', { count: me.attack }) }}</span> ·
                <span class="text-success">{{ t('game.resources.authority', { count: me.hp }) }}</span>
              </p>
            </div>
            <div
              v-if="canAct"
              class="flex flex-wrap gap-3"
            >
              <AppButton
                v-if="canAttackPlayer"
                @click="requestAction({ type: 'attack_player', payload: { amount: me.attack } })"
              >
                {{ t('game.attackPlayer', { name: opponent.username, count: me.attack }) }}
              </AppButton>
              <AppButton
                :loading="isSending"
                variant="danger"
                @click="requestAction({ type: 'end_turn', payload: {} })"
              >
                {{ t('game.endTurn') }}
              </AppButton>
            </div>
          </div>
        </div>
      </div>
    </template>
    <CardPileModal
      v-if="selectedPile"
      :title="t('game.pileTitle', { name: selectedPile.ownerName })"
      :cards="pileCards"
      :dismissible="!isSending"
      @close="selectedPile = null"
      @inspect="inspect"
    />
    <CardDetailsModal
      v-if="inspectedCard"
      :card="inspectedCard"
      :dismissible="!isSending"
      @close="selectedCard = null"
    />
    <ConfirmActionModal
      v-if="confirmation && confirmation.version === game?.version"
      :title="t(confirmation.titleKey, confirmation.params ?? {})"
      :message="t(confirmation.messageKey)"
      :disabled="!canAct"
      :loading="isSending"
      @close="confirmation = null"
      @confirm="confirmAction"
    />
  </section>
</template>
