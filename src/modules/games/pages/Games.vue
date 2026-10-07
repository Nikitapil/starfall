<script setup lang="ts">
import { useI18n } from '@/plugins/i18n';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import AppPageHeader from '@/components/layout/AppPageHeader.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppCard from '@/components/ui/AppCard.vue';
import IconStar from '@/components/icons/IconStar.vue';
import StarfallLoader from '@/components/ui/StarfallLoader.vue';
import { useGamesList } from '../useGamesList';
import GameListItem from '@/modules/games/components/GameListItem.vue';
import CreateGameModal from '@/modules/games/components/CreateGameModal.vue';

const { games, getGames, isLoading, error } = useGamesList();
const router = useRouter();
const isCreateModalOpen = ref(false);

getGames();

const { t } = useI18n();
</script>

<template>
  <section class="w-full py-12 sm:py-16">
    <AppPageHeader
      :eyebrow="t('lobby.eyebrow')"
      :title="t('lobby.title')"
      :description="t('lobby.description')"
    >
      <template #actions>
        <AppButton
          size="lg"
          @click="isCreateModalOpen = true"
        >
          <template #leading><span aria-hidden="true">+</span></template>
          {{ t('lobby.create') }}
        </AppButton>
      </template>
    </AppPageHeader>

    <div
      v-if="isLoading"
      class="grid min-h-80 place-items-center py-16"
    >
      <StarfallLoader :label="t('lobby.loading')" />
    </div>

    <AppCard
      v-else-if="error"
      class="mt-8 text-center"
      variant="danger"
    >
      <p
        role="alert"
        class="text-sm text-ink"
      >
        {{ error }}
      </p>
      <AppButton
        class="mt-5"
        variant="secondary"
        @click="getGames"
      >
        {{ t('common.retry') }}
      </AppButton>
    </AppCard>

    <AppCard
      v-else-if="!games.length"
      class="mt-8 flex min-h-80 flex-col items-center justify-center text-center"
    >
      <span
        class="grid size-16 place-items-center rounded-full border border-accent/20 bg-accent-soft text-accent"
        aria-hidden="true"
      >
        <IconStar class="size-8" />
      </span>
      <h2 class="mt-6 font-display text-2xl font-semibold tracking-tight text-ink">{{ t('lobby.emptyTitle') }}</h2>
      <p class="mt-3 max-w-sm text-sm leading-6 text-ink-muted">
        {{ t('lobby.emptyText') }}
      </p>
    </AppCard>

    <div
      v-else
      class="mt-8"
    >
      <div class="mb-4 flex items-center justify-between gap-4">
        <h2
          id="available-games"
          class="text-sm font-semibold text-ink"
        >
          {{ t('lobby.available') }}
        </h2>
        <span class="rounded-full border border-line bg-surface px-3 py-1 font-mono text-xs text-ink-muted">
          {{ t('lobby.gameCount', games.length) }}
        </span>
      </div>

      <ul
        class="grid gap-3"
        aria-labelledby="available-games"
      >
        <GameListItem
          v-for="game in games"
          :key="game.id"
          :game="game"
        />
      </ul>
    </div>
  </section>
  <CreateGameModal
    v-if="isCreateModalOpen"
    v-model="isCreateModalOpen"
    @created="router.push({ name: 'game', params: { gameId: $event } })"
  />
</template>
