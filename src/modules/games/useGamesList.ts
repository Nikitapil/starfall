import { ref } from 'vue';
import type { StarfallGameListItemDto } from '@/api/swagger/Starfall/data-contracts.ts';
import { useStarfall } from '@/api/swagger/Starfall/Starfall';

export const useGamesList = () => {
  const { getStarfallGames } = useStarfall();

  const games = ref<StarfallGameListItemDto[]>([]);
  const isLoading = ref(false);
  const error = ref('');

  const getGames = async () => {
    isLoading.value = true;
    error.value = '';
    try {
      games.value = await getStarfallGames({ notStarted: true });
    } catch {
      error.value = 'We couldn’t load the games. Please try again.';
    } finally {
      isLoading.value = false;
    }
  };

  return { games, isLoading, error, getGames };
};
