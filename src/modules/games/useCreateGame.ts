import { ref } from 'vue';
import { useStarfall } from '@/api/swagger/Starfall/Starfall';
import type { CreateStarfallGameDto } from '@/api/swagger/Starfall/data-contracts';

export const useCreateGame = () => {
  const { createStarfallGame } = useStarfall();
  const isLoading = ref(false);
  const error = ref('');

  const createGame = async (data: CreateStarfallGameDto) => {
    if (isLoading.value) return null;

    isLoading.value = true;
    error.value = '';
    try {
      return await createStarfallGame(data);
    } catch {
      error.value = 'We couldn’t create the game. Please try again.';
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  return { createGame, isLoading, error };
};
