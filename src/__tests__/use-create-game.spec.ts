import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { StarfallGameViewDto } from '@/api/swagger/Starfall/data-contracts';
import { useCreateGame } from '@/modules/games/useCreateGame';

const { createStarfallGame } = vi.hoisted(() => ({ createStarfallGame: vi.fn() }));
vi.mock('@/api/swagger/Starfall/Starfall', () => ({
  useStarfall: () => ({ createStarfallGame })
}));

beforeEach(() => createStarfallGame.mockReset());

describe('useCreateGame', () => {
  it.each([10, 50, 500])('sends HP %s and returns the created game', async (startingHp) => {
    const game = { id: 'new-game' };
    createStarfallGame.mockResolvedValue(game);
    const { createGame, isLoading, error } = useCreateGame();

    expect(isLoading.value).toBe(false);
    expect(error.value).toBe('');
    expect(await createGame({ startingHp })).toEqual(game);
    expect(createStarfallGame).toHaveBeenCalledExactlyOnceWith({ startingHp });
    expect(isLoading.value).toBe(false);
    expect(error.value).toBe('');
  });

  it('ignores duplicate requests while the first request is pending', async () => {
    let resolveCreation!: (game: Pick<StarfallGameViewDto, 'id'>) => void;
    createStarfallGame.mockReturnValue(
      new Promise((resolve) => {
        resolveCreation = resolve;
      })
    );
    const { createGame, isLoading } = useCreateGame();

    const pending = createGame({ startingHp: 75 });
    expect(isLoading.value).toBe(true);
    expect(await createGame({ startingHp: 100 })).toBeNull();
    expect(createStarfallGame).toHaveBeenCalledExactlyOnceWith({ startingHp: 75 });
    expect(isLoading.value).toBe(true);

    resolveCreation({ id: 'new-game' });
    expect(await pending).toEqual({ id: 'new-game' });
    expect(isLoading.value).toBe(false);
  });

  it('ends loading on failure and clears the error when retrying', async () => {
    createStarfallGame.mockRejectedValueOnce(new Error('Network failure'));
    createStarfallGame.mockResolvedValueOnce({ id: 'retry-game' });
    const { createGame, isLoading, error } = useCreateGame();

    expect(await createGame({ startingHp: 75 })).toBeNull();
    expect(isLoading.value).toBe(false);
    expect(error.value).toBe('We couldn’t create the game. Please try again.');

    const retry = createGame({ startingHp: 75 });
    expect(error.value).toBe('');
    expect(isLoading.value).toBe(true);
    expect(await retry).toEqual({ id: 'retry-game' });
    expect(createStarfallGame).toHaveBeenCalledTimes(2);
    expect(createStarfallGame).toHaveBeenLastCalledWith({ startingHp: 75 });
    expect(isLoading.value).toBe(false);
    expect(error.value).toBe('');
  });
});
