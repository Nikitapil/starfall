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
  <section
    class="game-page min-w-0 w-full"
    :class="{ 'has-table': game && game.status !== 'waiting' && me && opponent }"
  >
    <header class="table-toolbar">
      <AppButton
        variant="ghost"
        class="menu-button"
        @click="menuOpen = true"
        >{{ t('game.board.menu') }}</AppButton
      >
      <p
        v-if="game?.status === 'active'"
        class="turn-state text-accent"
        role="status"
      >
        {{ t(game.pendingAction ? 'game.resolve' : isMyTurn ? 'game.yourTurn' : 'game.opponentTurn') }}
      </p>
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
        class="session-message shrink-0"
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
        class="session-message shrink-0"
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
        <div class="opponent-area">
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
            <div
              v-if="enemyCards.length"
              class="fleet-cards"
              :style="{ '--cards': enemyCards.length }"
            >
              <TableCard
                v-for="card in enemyCards"
                :key="card.id"
                :card="card"
                in-play
                :actionable="card.type === 'base' && canAct && canAttackBase(game, playerId, card)"
                @inspect="inspect"
                @activate="activateCard"
              />
            </div>
          </section>
        </div>

        <section
          class="market-lane"
          :aria-label="t('game.tradeSector')"
        >
          <span
            class="trade-deck-count"
            :title="t('game.tradeDeckCount', { count: game.unusedTradeDeckCount })"
            :aria-label="t('game.tradeDeckCount', { count: game.unusedTradeDeckCount })"
            ><IconGameResource kind="deck" />{{ game.unusedTradeDeckCount }}</span
          >
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
          </div>
          <p
            v-if="me.nextShipToTop"
            class="market-hint text-accent"
          >
            {{ t('game.nextShipHint') }}
          </p>
        </section>

        <div class="player-area">
          <section
            class="fleet-lane own-bases"
            :aria-label="t('game.yourBases')"
          >
            <div
              v-if="me.bases.length"
              class="base-cards"
              :style="{ '--base-rows': Math.min(me.bases.length, 2) }"
            >
              <TableCard
                v-for="card in me.bases"
                :key="card.id"
                :card="card"
                in-play
                :actionable="hasAvailableAbility(card)"
                @inspect="inspect"
                @activate="activateCard"
              />
            </div>
          </section>

          <section
            class="fleet-lane own-lane"
            :aria-label="t('game.yourShips')"
          >
            <div
              v-if="me.playedShips.length"
              class="fleet-cards"
              :style="{ '--cards': me.playedShips.length }"
            >
              <TableCard
                v-for="card in me.playedShips"
                :key="card.id"
                :card="card"
                in-play
                :actionable="hasAvailableAbility(card)"
                @inspect="inspect"
                @activate="activateCard"
              />
            </div>
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
          </section>

          <footer class="turn-bar">
            <div class="turn-resources">
              <span
                class="resource-token text-warning"
                :title="t('game.terms.trade')"
                :aria-label="t('game.resources.trade', { count: me.money })"
              >
                <IconGameResource kind="trade" />
                {{ me.money }}
              </span>
              <AppButton
                v-if="canAttackPlayer"
                class="attack-token text-danger"
                variant="secondary"
                :aria-label="t('game.attackPlayer', { name: opponent.username, count: me.attack })"
                :title="t('game.attackPlayer', { name: opponent.username, count: me.attack })"
                @click="requestAction({ type: 'attack_player', payload: { amount: me.attack } })"
              >
                <template #leading><IconGameResource kind="combat" /></template>
                {{ me.attack }}
                <span
                  class="attack-arrow"
                  aria-hidden="true"
                >
                  ↗
                </span>
              </AppButton>
              <span
                v-else
                class="resource-token text-danger"
                :title="t('game.terms.combat')"
                :aria-label="t('game.resources.combat', { count: me.attack })"
              >
                <IconGameResource kind="combat" />
                {{ me.attack }}
              </span>
            </div>
            <p
              v-if="protectedByOutpost"
              class="outpost-hint text-warning"
            >
              {{ t('game.board.outposts') }}
            </p>
            <AppButton
              v-if="game.status === 'active'"
              :disabled="!canAct"
              :loading="isSending"
              class="end-turn"
              variant="secondary"
              @click="requestAction({ type: 'end_turn', payload: {} })"
            >
              {{ t('game.endTurn') }}
            </AppButton>
            <div
              v-else
              class="text-center"
              role="status"
            >
              <h2 class="font-semibold text-accent">{{ t(isWinner ? 'game.victory' : 'game.defeat') }}</h2>
              <AppButton
                variant="ghost"
                :to="{ name: 'games' }"
              >
                {{ t('game.back') }}
              </AppButton>
            </div>
          </footer>
        </div>

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
        <p
          v-if="game"
          class="text-sm text-ink-muted"
        >
          {{ t('game.board.turn', { count: game.turnNumber }) }}
        </p>
        <LangSwitcher class="self-start" />
        <AppButton
          :to="{ name: 'games' }"
          variant="secondary"
        >
          {{ t('game.back') }}
        </AppButton>
        <AppButton
          :to="{ name: 'rules' }"
          variant="secondary"
        >
          {{ t('game.board.rules') }}
        </AppButton>
        <AppButton
          variant="ghost"
          @click="auth.logout()"
          >
          {{ t('common.logout') }}
        </AppButton>
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
  --table-scale: clamp(0.5rem, min(1.4vw, 2.5dvh), 1rem);
  position: relative;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: max(0.5rem, env(safe-area-inset-top)) max(0.5rem, env(safe-area-inset-right))
    max(0.5rem, env(safe-area-inset-bottom)) max(0.5rem, env(safe-area-inset-left));
}
.table-toolbar {
  flex: none;
}
.has-table .table-toolbar {
  position: absolute;
  top: max(0.5rem, env(safe-area-inset-top));
  left: max(0.5rem, env(safe-area-inset-left));
  z-index: 2;
}
.menu-button {
  padding-inline: 0.75em;
  font-size: max(0.6875rem, var(--table-scale));
}
.has-table .session-message {
  margin-left: 6rem;
}
.game-table {
  position: relative;
  display: grid;
  grid-template-rows: minmax(4rem, 18fr) minmax(0, 34fr) minmax(9rem, 48fr);
  gap: 0.65em;
  flex: 1;
  min-height: 0;
  min-width: 0;
  width: min(100%, 90em);
  margin-inline: auto;
  font-size: var(--table-scale);
  background: radial-gradient(
    ellipse at 50% 42%,
    color-mix(in srgb, var(--color-accent-soft) 35%, transparent),
    transparent 70%
  );
}
.opponent-area {
  display: grid;
  grid-template-columns: 14em minmax(0, 1fr);
  gap: 2em;
  min-height: 0;
  padding-left: 8em;
  padding-right: 7em;
}
.opponent-status {
  align-self: center;
}
.player-area {
  display: grid;
  grid-template-columns: max(116px, 13em) minmax(0, 1fr) 12em;
  grid-template-rows: minmax(7.5em, 42fr) minmax(0, 58fr);
  gap: 0.7em 1.25em;
  min-height: 0;
}
.own-bases {
  grid-column: 1;
  grid-row: 1 / -1;
}
.own-lane {
  grid-column: 2;
  grid-row: 1;
}
.hand-zone {
  grid-column: 2;
  grid-row: 2;
}
.own-status {
  grid-column: 3;
  grid-row: 1;
  align-self: start;
}
.turn-bar {
  grid-column: 3;
  grid-row: 1 / -1;
  align-self: end;
}
.fleet-lane,
.market-lane,
.hand-zone {
  position: relative;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.fleet-cards,
.hand-cards,
.base-cards,
.market-cards {
  display: grid;
  gap: 0.45em;
  min-width: 0;
  min-height: 0;
  flex: 1;
  padding: 3px;
  overflow-x: auto;
  overflow-y: hidden;
  overscroll-behavior: contain;
  scrollbar-width: thin;
}
.fleet-cards {
  grid-template-columns: repeat(var(--cards), minmax(110px, 14em));
  grid-template-rows: minmax(0, 1fr);
  justify-content: safe center;
}
.base-cards {
  grid-auto-flow: column;
  grid-auto-columns: minmax(110px, 1fr);
  grid-template-rows: repeat(var(--base-rows), minmax(0, 1fr));
  height: 100%;
  max-height: calc(var(--base-rows) * 7em + (var(--base-rows) - 1) * 0.45em + 6px);
  flex: none;
  margin-block: auto;
}
.hand-cards {
  grid-template-columns: repeat(var(--cards), minmax(8.5em, 10em));
  grid-template-rows: minmax(0, 1fr);
  justify-content: safe center;
}
.market-lane {
  padding-inline: 6em;
}
.market-cards {
  grid-template-columns: repeat(6, minmax(0, 12em));
  grid-template-rows: minmax(0, 1fr);
  justify-content: center;
  gap: 0.75em;
}
.trade-deck-count {
  position: absolute;
  right: 1em;
  bottom: 0.5em;
  display: inline-flex;
  align-items: center;
  gap: 0.2em;
  color: var(--color-ink-faint);
  font: 0.8em var(--font-mono);
}
.trade-deck-count svg {
  width: 1.2em;
  height: 1.2em;
}
.market-hint {
  position: absolute;
  bottom: 100%;
  left: 6em;
  font-size: 0.75em;
}
.turn-bar {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: end;
  gap: 0.5em;
}
.turn-state,
.outpost-hint {
  font-size: 0.75em;
  line-height: 1.15;
  text-align: center;
}
.turn-state {
  max-width: 8em;
  margin-inline: auto;
  font-size: max(0.5625rem, calc(var(--table-scale) * 0.75));
}
.turn-resources {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5em;
}
.resource-token,
.attack-token {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.2em;
  min-height: 2.75rem;
  font: 600 1.5em var(--font-mono);
}
.resource-token svg,
.attack-token :deep(svg) {
  width: 1em;
  height: 1em;
}
.attack-token {
  min-width: 2.75rem;
  padding-inline: 0.3em;
  border-color: var(--color-danger);
  color: var(--color-danger);
}
.attack-arrow {
  font-size: 0.5em;
  margin-left: 0.1em;
}
.end-turn {
  width: 100%;
  min-width: 0;
  overflow-wrap: anywhere;
  padding-inline: 0.5em;
  border-color: var(--color-accent);
  font-size: max(0.6875rem, 0.9em);
  color: var(--color-accent);
}
.pending-overlay {
  position: absolute;
  z-index: 20;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: min(100%, 46rem);
  max-height: 90%;
  overflow: auto;
  background: var(--color-surface);
  border-radius: var(--radius-panel);
  box-shadow: var(--shadow-panel);
  font-size: 1rem;
}
@media (orientation: landscape) and (max-height: 500px) {
  .game-page {
    gap: 0.25rem;
    padding-block: max(0.25rem, env(safe-area-inset-top)) max(0.25rem, env(safe-area-inset-bottom));
  }
  .game-table {
    gap: 0.4em;
  }
  .player-area {
    gap: 0.4em 0.8em;
  }
  .turn-bar {
    gap: 0.2em;
  }
  .outpost-hint {
    font-size: 0.85em;
  }
  .resource-token,
  .attack-token {
    font-size: 1.5em;
  }
  .end-turn {
    min-height: 2.75rem;
  }
}
@media (orientation: landscape) and (max-height: 350px) {
  .game-table {
    gap: 0.1em;
  }
}
@media (orientation: portrait) and (max-width: 699px) {
  .game-page {
    --table-scale: 0.6875rem;
  }
  .game-table {
    grid-template-rows: minmax(7em, 18fr) minmax(20em, 44fr) minmax(21em, 38fr);
  }
  .opponent-area {
    padding: 0 0 0 min(6em, 20%);
    grid-template-columns: min(10em, 40%) minmax(0, 1fr);
    gap: 0.5em;
  }
  .market-lane {
    padding-inline: 0;
  }
  .market-cards {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    grid-template-rows: repeat(2, minmax(0, 1fr));
  }
  .trade-deck-count {
    bottom: 100%;
    right: 0;
  }
  .market-hint {
    left: 0;
    max-width: 80%;
  }
  .player-area {
    grid-template-columns: min(8em, 25%) minmax(0, 1fr) min(8em, 25%);
    grid-template-rows: minmax(8em, 40fr) minmax(12em, 60fr);
    column-gap: 0.3em;
  }
  .turn-resources {
    flex-wrap: wrap;
    gap: 0.1em;
  }
  .resource-token,
  .attack-token {
    font-size: 1.1em;
  }
}
</style>
