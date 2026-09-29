import type { StarfallLobbyDto } from '@/api/swagger/Starfall/data-contracts';
import type { GameCard, GameView } from '@/modules/games/game-types';

export const makeCard = (overrides: Partial<GameCard> = {}): GameCard =>
  ({
    id: 'scout-1',
    name: 'Scout',
    deck: 'starter',
    type: 'ship',
    fraction: 'none',
    count: 16,
    cost: 0,
    money: 1,
    attack: 0,
    abilities: [],
    matchAbilities: [],
    removeAbility: null,
    persistentAbilities: [],
    picture: '',
    outpost: false,
    currentDefense: null,
    playedThisTurn: false,
    usedAbilities: [],
    copiedCardId: null,
    abilityStates: [],
    ...overrides
  }) as GameCard;
export const makeGame = (overrides: Partial<GameView> = {}): GameView =>
  ({
    id: 'game-1',
    startingHp: 50,
    status: 'active',
    currentPlayerId: '1',
    winnerId: null,
    turnNumber: 1,
    version: 1,
    pendingAction: null,
    tradeRow: [makeCard({ id: 'trade-1', name: 'Cutter', cost: 2 })],
    explorersCount: 10,
    explorer: makeCard({ id: 'explorer-1', name: 'Explorer', cost: 2, money: 2 }),
    unusedTradeDeckCount: 75,
    scrappedCards: [],
    players: [
      {
        id: '1',
        username: 'Alice',
        hp: 50,
        attack: 5,
        money: 2,
        isWinner: false,
        hand: [makeCard()],
        handCount: 1,
        deckCount: 7,
        discard: [],
        bases: [],
        playedShips: [],
        nextShipToTop: false
      },
      {
        id: '2',
        username: 'Bob',
        hp: 50,
        attack: 0,
        money: 0,
        isWinner: false,
        handCount: 5,
        deckCount: 5,
        discard: [],
        bases: [],
        playedShips: []
      }
    ],
    ...overrides
  }) as GameView;
export const makeLobby = (overrides: Partial<StarfallLobbyDto> = {}): StarfallLobbyDto =>
  ({
    id: 'game-1',
    version: 1,
    startingHp: 50,
    status: 'active',
    players: [
      { id: '1', username: 'Alice' },
      { id: '2', username: 'Bob' }
    ],
    ...overrides
  }) as StarfallLobbyDto;
export const deferred = <T>() => {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
};
export const apiFailure = (status?: number, message = 'Request failed') =>
  Object.assign(new Error(message), {
    isAxiosError: true,
    response: status ? { status, data: { message } } : undefined
  });
