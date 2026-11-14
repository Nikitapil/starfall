<script setup lang="ts">
import { useI18n } from '@/plugins/i18n';
import { computed, onMounted, onUnmounted, ref, shallowRef } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/modules/auth/useAuth';
import AppButton from '@/components/ui/AppButton.vue';
import AppCard from '@/components/ui/AppCard.vue';
import StarfallLoader from '@/components/ui/StarfallLoader.vue';
import { useGame } from '../useGame';
import type { GameAction, GameCard as Card } from '../game-types';
import { canAttackBase } from '../game-presentation';
import TableCard from '../components/board/TableCard.vue';
import IconGameResource from '@/components/icons/IconGameResource.vue';
import AppModal from '@/components/ui/AppModal.vue';
import LangSwitcher from '@/components/layout/LangSwitcher.vue';
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
const menuOpen = ref(false);
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

const enemyCards = computed(() => [...(opponent.value?.bases ?? []), ...(opponent.value?.playedShips ?? [])]);
const marketCards = computed(() => [
  ...(game.value?.explorer ? [game.value.explorer] : []),
  ...(game.value?.tradeRow ?? [])
]);
const inspectedLocation = computed(() => {
  const id = inspectedCard.value?.id;
  if (!id) return null;
  if (me.value?.hand?.some((card) => card.id === id)) return 'hand';
  if (marketCards.value.some((card) => card.id === id)) return 'market';
  if (myCardsInPlay.value.some((card) => card.id === id)) return 'fleet';
  if (opponent.value?.bases.some((card) => card.id === id)) return 'enemy-base';
  return null;
});
const hasAvailableAbility = (card: Card) =>
  canAct.value && card.abilityStates.some((ability) => ability.isAvailable && !ability.isUsed);
const requestCardAction = (action: GameAction) => {
  selectedCard.value = null;
  requestAction(action);
};

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
const activateCard = (card: Card) => {
  if (
    menuOpen.value ||
    selectedPile.value ||
    selectedCard.value ||
    (confirmation.value && confirmation.value.version === game.value?.version)
  )
    return;
  if (!game.value || !canAct.value) {
    inspect(card);
    return;
  }
  if (me.value?.hand?.some((candidate) => candidate.id === card.id)) {
    requestAction({ type: 'play_card', payload: { cardId: card.id } });
    return;
  }
  const marketCard = marketCards.value.find((candidate) => candidate.id === card.id);
  if (marketCard && me.value && me.value.money >= marketCard.cost) {
    requestAction({ type: 'buy_card', payload: { cardId: marketCard.id } });
    return;
  }
  const enemyBase = opponent.value?.bases.find((candidate) => candidate.id === card.id);
  if (enemyBase && canAttackBase(game.value, playerId.value, enemyBase)) {
    requestAction({ type: 'attack_base', payload: { cardId: enemyBase.id } });
    return;
  }
  const playedCard = myCardsInPlay.value.find((candidate) => candidate.id === card.id);
  const abilities = playedCard?.abilityStates.filter((ability) => ability.isAvailable && !ability.isUsed) ?? [];
  if (abilities.length === 1) {
    requestAction({ type: 'use_ability', payload: { cardId: card.id, abilityId: abilities[0]!.id } });
    return;
  }
  inspect(card);
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
  <section class="game-page min-w-0 w-full">
    <header class="table-toolbar">
      <AppButton
        variant="ghost"
        class="menu-button"
        @click="menuOpen = true"
        >{{ t('game.board.menu') }}</AppButton
      >
      <p
        v-if="game?.status === 'active'"
        class="text-xs text-accent"
        role="status"
      >
        {{ t(game.pendingAction ? 'game.resolve' : isMyTurn ? 'game.yourTurn' : 'game.opponentTurn') }}
      </p>
      <span
        v-if="game"
        class="text-xs font-mono text-ink-muted"
        >{{ t('game.board.turn', { count: game.turnNumber }) }}</span
      >
    </header>
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
        class="shrink-0"
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
        class="shrink-0"
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
        class="game-table"
      >
        <PlayerStatus
          class="opponent-status"
          :player="opponent"
          :active="game.status === 'active' && !isMyTurn"
          @discard="showDiscard(opponent.id, opponent.username)"
        />

        <section
          class="fleet-lane enemy-lane"
          :aria-label="t('game.board.enemyFleet')"
        >
          <h2 class="zone-label">
            {{ t('game.board.enemyFleet') }} <span>{{ enemyCards.length }}</span
            ><span
              v-if="protectedByOutpost"
              class="text-warning"
            >
              · {{ t('game.board.outposts') }}</span
            >
          </h2>
          <div
            v-if="enemyCards.length"
            class="fleet-cards"
            :style="{ '--cards': enemyCards.length }"
          >
            <TableCard
              v-for="card in enemyCards"
              :key="card.id"
              :card="card"
              :actionable="card.type === 'base' && canAct && canAttackBase(game, playerId, card)"
              @inspect="inspect"
              @activate="activateCard"
            />
          </div>
          <p
            v-else
            class="empty-lane"
          >
            {{ t('game.noEnemyBases') }}
          </p>
        </section>

        <section
          class="market-lane"
          :aria-label="t('game.tradeSector')"
        >
          <div class="zone-label">
            <h2>{{ t('game.tradeSector') }}</h2>
            <span
              :title="t('game.tradeDeckCount', { count: game.unusedTradeDeckCount })"
              :aria-label="t('game.tradeDeckCount', { count: game.unusedTradeDeckCount })"
              ><IconGameResource kind="deck" />{{ game.unusedTradeDeckCount }}</span
            >
          </div>
          <div class="market-cards">
            <TableCard
              v-for="card in marketCards"
              :key="card.id"
              :card="card"
              market
              :remaining="card.id === game.explorer?.id ? game.explorersCount : undefined"
              :actionable="canAct && me.money >= card.cost"
              @inspect="inspect"
              @activate="activateCard"
            />
            <p
              v-if="!marketCards.length"
              class="empty-lane"
            >
              {{ t('game.tradeEmpty') }}
            </p>
          </div>
          <p
            v-if="me.nextShipToTop"
            class="text-xs text-accent"
          >
            {{ t('game.nextShipHint') }}
          </p>
        </section>

        <section
          class="fleet-lane own-lane"
          :aria-label="t('game.yourFleet')"
        >
          <h2 class="zone-label">
            {{ t('game.yourFleet') }} <span>{{ myCardsInPlay.length }}</span>
          </h2>
          <div
            v-if="myCardsInPlay.length"
            class="fleet-cards"
            :style="{ '--cards': myCardsInPlay.length }"
          >
            <TableCard
              v-for="card in myCardsInPlay"
              :key="card.id"
              :card="card"
              :actionable="hasAvailableAbility(card)"
              @inspect="inspect"
              @activate="activateCard"
            />
          </div>
          <p
            v-else
            class="empty-lane"
          >
            {{ t('game.emptyZone') }}
          </p>
        </section>

        <PlayerStatus
          class="own-status"
          :player="me"
          :active="isMyTurn"
          own
          @discard="showDiscard(me.id, me.username)"
        />

        <section
          class="hand-zone"
          :aria-label="t('game.yourHand')"
        >
          <h2 class="zone-label">
            {{ t('game.yourHand') }} <span>{{ me.hand?.length ?? 0 }}</span>
          </h2>
          <div
            v-if="me.hand?.length"
            class="hand-cards"
            :style="{ '--cards': me.hand.length }"
          >
            <TableCard
              v-for="card in me.hand"
              :key="card.id"
              :card="card"
              :actionable="canAct"
              @inspect="inspect"
              @activate="activateCard"
            />
          </div>
          <p
            v-else
            class="empty-lane"
          >
            {{ t('game.emptyHand') }}
          </p>
        </section>

        <footer class="turn-bar">
          <div class="turn-resources">
            <span
              class="resource-token text-warning"
              :title="t('game.terms.trade')"
              :aria-label="t('game.resources.trade', { count: me.money })"
              ><IconGameResource kind="trade" />{{ me.money }}</span
            >
            <AppButton
              v-if="canAttackPlayer"
              class="attack-token text-danger"
              variant="secondary"
              :aria-label="t('game.attackPlayer', { name: opponent.username, count: me.attack })"
              :title="t('game.attackPlayer', { name: opponent.username, count: me.attack })"
              @click="requestAction({ type: 'attack_player', payload: { amount: me.attack } })"
              ><template #leading><IconGameResource kind="combat" /></template>{{ me.attack
              }}<span
                class="attack-arrow"
                aria-hidden="true"
                >↗</span
              ></AppButton
            >
            <span
              v-else
              class="resource-token text-danger"
              :title="t('game.terms.combat')"
              :aria-label="t('game.resources.combat', { count: me.attack })"
              ><IconGameResource kind="combat" />{{ me.attack }}</span
            >
          </div>
          <AppButton
            v-if="game.status === 'active'"
            :disabled="!canAct"
            :loading="isSending"
            class="end-turn"
            @click="requestAction({ type: 'end_turn', payload: {} })"
            >{{ t('game.endTurn') }}</AppButton
          >
          <div
            v-else
            class="text-center"
            role="status"
          >
            <h2 class="font-semibold text-accent">{{ t(isWinner ? 'game.victory' : 'game.defeat') }}</h2>
            <AppButton
              variant="ghost"
              :to="{ name: 'games' }"
              >{{ t('game.back') }}</AppButton
            >
          </div>
        </footer>

        <div
          v-if="game.pendingAction?.playerId === playerId"
          class="pending-overlay"
        >
          <PendingActionPanel
            :game="game"
            :playerId="playerId"
            :disabled="!canSend"
            :loading="isSending"
            @action="requestAction"
            @inspect="inspect"
          />
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
    >
      <template #actions>
        <AppButton
          v-if="inspectedLocation === 'hand'"
          block
          :disabled="!canAct"
          @click="requestCardAction({ type: 'play_card', payload: { cardId: inspectedCard.id } })"
          >{{ t(inspectedCard.type === 'ship' ? 'game.playShip' : 'game.playBase') }}</AppButton
        >
        <AppButton
          v-if="inspectedLocation === 'market'"
          block
          :disabled="!canAct || !me || me.money < inspectedCard.cost"
          @click="requestCardAction({ type: 'buy_card', payload: { cardId: inspectedCard.id } })"
          >{{ t('game.buy', { count: inspectedCard.cost }) }}</AppButton
        >
        <AppButton
          v-if="inspectedLocation === 'enemy-base' && game"
          block
          variant="secondary"
          :disabled="!canAct || !canAttackBase(game, playerId, inspectedCard)"
          @click="requestCardAction({ type: 'attack_base', payload: { cardId: inspectedCard.id } })"
          >{{ t('game.attackBase', { count: inspectedCard.currentDefense ?? inspectedCard.health ?? 0 }) }}</AppButton
        >
        <AbilityButtons
          v-if="inspectedLocation === 'fleet'"
          :card="inspectedCard"
          :disabled="!canAct"
          class="w-full"
          @action="requestCardAction"
        />
      </template>
    </CardDetailsModal>
    <AppModal
      v-if="menuOpen"
      :model-value="true"
      :title="t('game.board.menu')"
      @update:model-value="menuOpen = false"
    >
      <div class="flex flex-col gap-3">
        <LangSwitcher class="self-start" />
        <AppButton
          :to="{ name: 'games' }"
          variant="secondary"
          >{{ t('game.back') }}</AppButton
        >
        <AppButton
          :to="{ name: 'rules' }"
          variant="secondary"
          >{{ t('game.board.rules') }}</AppButton
        >
        <AppButton
          variant="ghost"
          @click="auth.logout()"
          >{{ t('common.logout') }}</AppButton
        >
      </div>
    </AppModal>
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

<style scoped>
.game-page {
  height: 100dvh;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: max(0.25rem, env(safe-area-inset-top)) max(0.5rem, env(safe-area-inset-right))
    max(0.5rem, env(safe-area-inset-bottom)) max(0.5rem, env(safe-area-inset-left));
}
.table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  flex-shrink: 0;
}
.menu-button {
  padding-inline: 0.5rem;
}
.game-table {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 5rem;
  grid-template-rows:
    minmax(min-content, 0.65fr) minmax(min-content, 2fr) minmax(min-content, 0.65fr) minmax(min-content, 1fr)
    auto;
  gap: 0.3rem;
  flex: 1;
  min-height: 30rem;
  min-width: 0;
  background: radial-gradient(
    ellipse at 50% 42%,
    color-mix(in srgb, var(--color-accent-soft) 35%, transparent),
    transparent 70%
  );
}
.opponent-status {
  grid-row: 1;
  grid-column: 2;
}
.enemy-lane {
  grid-row: 1;
  grid-column: 1;
}
.market-lane {
  grid-row: 2;
  grid-column: 1 / -1;
}
.own-lane {
  grid-row: 3;
  grid-column: 1;
}
.own-status {
  grid-row: 3;
  grid-column: 2;
}
.hand-zone {
  grid-row: 4;
  grid-column: 1 / -1;
}
.turn-bar {
  grid-row: 5;
  grid-column: 1 / -1;
}
.fleet-lane,
.market-lane,
.hand-zone {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}
.zone-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.25rem;
  color: var(--color-ink-muted);
  font-size: 0.6rem;
  font-weight: 500;
  line-height: 1.2;
}
.zone-label > span {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  font-family: var(--font-mono);
}
.zone-label svg {
  width: 0.8rem;
  height: 0.8rem;
}
.fleet-cards,
.hand-cards {
  display: grid;
  grid-template-columns: repeat(var(--cards), minmax(2.75rem, 8rem));
  justify-content: safe center;
  gap: 0.2rem;
  min-height: min-content;
  flex: 1;
  overflow: auto;
  padding: 2px;
}
.fleet-cards {
  grid-template-columns: repeat(var(--cards), minmax(6.875rem, 8rem));
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scrollbar-width: thin;
}
.market-cards {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  grid-auto-rows: minmax(min-content, 1fr);
  gap: 0.3rem;
  min-height: 0;
  flex: 1;
  padding: 2px;
}
.empty-lane {
  align-self: center;
  margin-block: auto;
  color: var(--color-ink-faint);
  font-size: 0.65rem;
}
.market-lane {
  border-block: 1px solid var(--color-line);
  padding-block: 0.35rem;
}
.turn-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  min-width: 0;
}
.turn-resources {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.resource-token,
.attack-token {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.2rem;
  font: 600 1.2rem var(--font-mono);
}
.resource-token svg,
.attack-token :deep(svg) {
  width: 1.2rem;
  height: 1.2rem;
}
.attack-token {
  min-width: 2.75rem;
  padding-inline: 0.35rem;
  border-color: var(--color-danger);
  color: var(--color-danger);
}
.attack-arrow {
  font-size: 0.7rem;
  margin-left: 0.2rem;
}
.end-turn {
  min-width: 0;
  overflow-wrap: anywhere;
}
.pending-overlay {
  position: absolute;
  z-index: 20;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: min(100%, 46rem);
  max-height: 75%;
  overflow: auto;
  background: var(--color-surface);
  border-radius: var(--radius-panel);
  box-shadow: var(--shadow-panel);
}
@media (min-width: 700px) {
  .game-page {
    padding-inline: clamp(0.75rem, 3vw, 3rem);
  }
  .game-table {
    grid-template-columns: minmax(0, 1fr) 9rem;
    grid-template-rows: minmax(min-content, 0.7fr) minmax(min-content, 1.5fr) minmax(min-content, 0.7fr) minmax(
        min-content,
        1fr
      );
    gap: 0.5rem 1rem;
    min-height: 20rem;
  }
  .opponent-status {
    grid-row: 1;
    grid-column: 2;
  }
  .enemy-lane {
    grid-row: 1;
    grid-column: 1;
  }
  .market-lane {
    grid-row: 2;
    grid-column: 1 / -1;
  }
  .own-lane {
    grid-row: 3;
    grid-column: 1;
  }
  .own-status {
    grid-row: 3;
    grid-column: 2;
  }
  .hand-zone {
    grid-row: 4;
    grid-column: 1;
  }
  .turn-bar {
    grid-row: 4;
    grid-column: 2;
    flex-direction: column;
    justify-content: center;
  }
  .market-cards {
    grid-template-columns: repeat(6, minmax(0, 10rem));
    grid-template-rows: minmax(min-content, 1fr);
    justify-content: center;
    gap: 0.6rem;
  }
  .hand-cards {
    grid-template-columns: repeat(var(--cards), minmax(2.75rem, 8rem));
    gap: 0.4rem;
  }
  .zone-label {
    font-size: 0.65rem;
  }
  .end-turn {
    width: 100%;
  }
}
@media (min-width: 1100px) {
  .game-page {
    max-width: 1500px;
    margin-inline: auto;
  }
  .game-table {
    column-gap: 2rem;
    grid-template-columns: minmax(0, 1fr) 11rem;
  }
  .market-cards {
    grid-template-columns: repeat(6, minmax(0, 12rem));
    gap: 0.8rem;
  }
  .hand-cards {
    grid-template-columns: repeat(var(--cards), minmax(2.75rem, 10rem));
  }
}
@media (max-height: 500px) and (min-width: 700px) {
  .game-page {
    gap: 0;
    padding-block: 0.1rem;
  }
  .game-table {
    gap: 0.2rem 0.5rem;
    min-height: 17rem;
    grid-template-rows: minmax(min-content, 0.65fr) minmax(min-content, 1.3fr) minmax(min-content, 0.65fr) minmax(
        min-content,
        1fr
      );
  }
  .zone-label {
    font-size: 0.5rem;
  }
  .market-lane {
    padding-block: 0.1rem;
  }
  .turn-bar {
    flex-direction: row;
    gap: 0.3rem;
  }
  .turn-resources {
    flex-direction: column;
    gap: 0;
  }
  .end-turn {
    padding-inline: 0.35rem;
    font-size: 0.75rem;
  }
}
</style>
