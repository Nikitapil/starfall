import { computed, ref } from 'vue';
import { i18n } from '@/plugins/i18n';
import type { StarfallGameListItemDto } from '@/api/swagger/Starfall/data-contracts.ts';
import { useStarfall } from '@/api/swagger/Starfall/Starfall';

export const useGamesList = () => {
  const { getStarfallGames } = useStarfall();

  const games = ref<StarfallGameListItemDto[]>([]);
  const isLoading = ref(false);
  const isError = ref(false);
  const error = computed(() => (isError.value ? i18n.global.t('lobby.loadFailed') : ''));

  const getGames = async () => {
    isLoading.value = true;
    isError.value = false;
    try {
      games.value = await getStarfallGames({ notStarted: true });
    } catch {
      isError.value = true;
    } finally {
      isLoading.value = false;
    }
  };

  return { games, isLoading, error, getGames };
};
