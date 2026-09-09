<script lang="ts" setup>
import type { StarfallGameListItemDto } from '@/api/swagger/Starfall/data-contracts.ts';
import IconStar from '@/components/icons/IconStar.vue';
import AppCard from '@/components/ui/AppCard.vue';
import { computed } from 'vue';
import { formatCreatedAt } from '@/helpers/date.ts';

const props = defineProps<{
  game: StarfallGameListItemDto;
}>();

const date = computed(() => formatCreatedAt(props.game.createdAt));
</script>

<template>
  <AppCard
    as="li"
    padding="none"
    interactive
  >
    <RouterLink
      :to="{ name: 'game', params: { gameId: game.id } }"
      class="group flex flex-col gap-5 rounded-card p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
    >
      <div class="flex min-w-0 items-start gap-4 sm:items-center">
        <span
          class="grid size-11 shrink-0 place-items-center rounded-control border border-line bg-surface-raised text-accent"
          aria-hidden="true"
        >
          <IconStar class="size-5" />
        </span>
        <div class="min-w-0">
          <h3 class="font-display text-lg font-semibold text-ink">Game #{{ game.id.slice(0, 8) }}</h3>
          <p class="mt-1 break-words text-sm text-ink-muted">
            {{ game.players.length ? game.players.join(' · ') : 'No players yet' }}
          </p>
        </div>
      </div>
      <div class="flex shrink-0 items-center justify-between gap-6 sm:text-right">
        <div>
          <p class="text-xs font-medium text-accent">
            {{ game.players.length }} {{ game.players.length === 1 ? 'player' : 'players' }}
          </p>
          <p class="mt-1 text-xs text-ink-muted">
            Created <time :datetime="game.createdAt">{{ date }}</time>
          </p>
        </div>
        <span
          class="text-sm font-semibold text-ink transition-colors group-hover:text-accent group-focus-visible:text-accent"
        >
          Open <span aria-hidden="true">→</span>
        </span>
      </div>
    </RouterLink>
  </AppCard>
</template>
