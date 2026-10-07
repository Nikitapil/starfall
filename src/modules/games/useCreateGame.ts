import { computed, ref } from 'vue';
import { i18n } from '@/plugins/i18n';
import { useStarfall } from '@/api/swagger/Starfall/Starfall';
import type { CreateStarfallGameDto } from '@/api/swagger/Starfall/data-contracts';

export const useCreateGame = () => {
  const { createStarfallGame } = useStarfall();
  const isLoading = ref(false);
  const isError = ref(false);
  const error = computed(() => (isError.value ? i18n.global.t('lobby.createFailed') : ''));

  const createGame = async (data: CreateStarfallGameDto) => {
    if (isLoading.value) return null;

    isLoading.value = true;
    isError.value = false;
    try {
      return await createStarfallGame(data);
    } catch {
      isError.value = true;
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  return { createGame, isLoading, error };
};
