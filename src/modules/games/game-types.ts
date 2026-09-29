import type { useStarfall } from '@/api/swagger/Starfall/Starfall';
import type { StarfallCardViewDto, StarfallGameViewDto } from '@/api/swagger/Starfall/data-contracts';

export type GameCommand = Parameters<ReturnType<typeof useStarfall>['executeStarfallCommand']>[1];
type ActionOf<T> = T extends { type: infer K extends string; payload: infer P } ? { type: `${K}`; payload: P } : never;
export type GameAction = ActionOf<GameCommand>;
export type GameCard = StarfallCardViewDto;
export type GameView = StarfallGameViewDto;
