/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface CardIdPayloadDto {
  /**
   * Card instance id
   * @example "card-uuid"
   */
  cardId: string;
}

export interface PlayCardCommandDto {
  /**
   * Unique idempotency key
   * @example "uuid"
   */
  commandId: string;
  /**
   * Expected game state version
   * @min 0
   */
  expectedVersion: number;
  type: PlayCardCommandDtoTypeEnum;
  payload: CardIdPayloadDto;
}

export interface BuyCardCommandDto {
  /**
   * Unique idempotency key
   * @example "uuid"
   */
  commandId: string;
  /**
   * Expected game state version
   * @min 0
   */
  expectedVersion: number;
  type: BuyCardCommandDtoTypeEnum;
  payload: CardIdPayloadDto;
}

export interface UseAbilityPayloadDto {
  /**
   * Card instance id
   * @example "card-uuid"
   */
  cardId: string;
  /**
   * Ability instance id
   * @example "ally:0"
   */
  abilityId: string;
}

export interface UseAbilityCommandDto {
  /**
   * Unique idempotency key
   * @example "uuid"
   */
  commandId: string;
  /**
   * Expected game state version
   * @min 0
   */
  expectedVersion: number;
  type: UseAbilityCommandDtoTypeEnum;
  payload: UseAbilityPayloadDto;
}

export interface ResolvePendingPayloadDto {
  /** Selected card instance id */
  cardId?: string;
  /** Selected card ids */
  cardIds?: string[];
  /**
   * Selected option index
   * @min 0
   */
  optionIndex?: number;
  /** Cancel an optional pending action */
  cancel?: boolean;
}

export interface ResolvePendingCommandDto {
  /**
   * Unique idempotency key
   * @example "uuid"
   */
  commandId: string;
  /**
   * Expected game state version
   * @min 0
   */
  expectedVersion: number;
  type: ResolvePendingCommandDtoTypeEnum;
  payload: ResolvePendingPayloadDto;
}

export type EmptyCommandPayloadDto = object;

export interface CancelPendingCommandDto {
  /**
   * Unique idempotency key
   * @example "uuid"
   */
  commandId: string;
  /**
   * Expected game state version
   * @min 0
   */
  expectedVersion: number;
  type: CancelPendingCommandDtoTypeEnum;
  payload: EmptyCommandPayloadDto;
}

export interface AttackBaseCommandDto {
  /**
   * Unique idempotency key
   * @example "uuid"
   */
  commandId: string;
  /**
   * Expected game state version
   * @min 0
   */
  expectedVersion: number;
  type: AttackBaseCommandDtoTypeEnum;
  payload: CardIdPayloadDto;
}

export interface AttackPlayerPayloadDto {
  /**
   * Combat points to spend
   * @min 1
   */
  amount: number;
}

export interface AttackPlayerCommandDto {
  /**
   * Unique idempotency key
   * @example "uuid"
   */
  commandId: string;
  /**
   * Expected game state version
   * @min 0
   */
  expectedVersion: number;
  type: AttackPlayerCommandDtoTypeEnum;
  payload: AttackPlayerPayloadDto;
}

export interface EndTurnCommandDto {
  /**
   * Unique idempotency key
   * @example "uuid"
   */
  commandId: string;
  /**
   * Expected game state version
   * @min 0
   */
  expectedVersion: number;
  type: EndTurnCommandDtoTypeEnum;
  payload: EmptyCommandPayloadDto;
}

export interface CreateStarfallGameDto {
  /**
   * Initial authority assigned to both players
   * @min 1
   * @max 500
   * @default 50
   * @example 50
   */
  startingHp: number;
}

export interface StarfallActionDto {
  name: StarfallActionDtoNameEnum;
  value?: number;
  max?: number;
  min?: number;
  optional?: boolean;
  drawPerScrapped?: number;
  fraction?: StarfallActionDtoFractionEnum;
  actions?: StarfallActionDto[];
  options?: StarfallActionDto[][];
}

export interface StarfallPendingActionDto {
  type: StarfallPendingActionDtoTypeEnum;
  playerId: string;
  sourceCardId?: string;
  abilityId?: string;
  zones?: StarfallPendingActionDtoZonesEnum[];
  min?: number;
  max?: number;
  count?: number;
  drawPerScrapped?: number;
  optional?: boolean;
  continuation?: StarfallActionDto[];
  options?: StarfallActionDto[][];
}

export interface StarfallPersistentAbilityDto {
  trigger: StarfallPersistentAbilityDtoTriggerEnum;
  action: StarfallActionDto;
}

export interface StarfallCardViewDto {
  id: string;
  deck: StarfallCardViewDtoDeckEnum;
  fraction: StarfallCardViewDtoFractionEnum;
  type: StarfallCardViewDtoTypeEnum;
  name: string;
  count: number;
  cost: number;
  abilities: StarfallActionDto[];
  matchAbilities: StarfallActionDto[];
  removeAbility: StarfallActionDto | null;
  persistentAbilities: StarfallPersistentAbilityDto[];
  money: number;
  attack: number;
  picture: string;
  health?: number;
  outpost: boolean;
  currentDefense: number | null;
  playedThisTurn: boolean;
  usedAbilities: string[];
}

export interface StarfallPlayerViewDto {
  id: string;
  hp: number;
  money: number;
  attack: number;
  isWinner: boolean;
  hand?: StarfallCardViewDto[];
  handCount: number;
  deckCount: number;
  discard: StarfallCardViewDto[];
  bases: StarfallCardViewDto[];
  playedShips: StarfallCardViewDto[];
}

export interface StarfallGameViewDto {
  id: string;
  startingHp: number;
  status: StarfallGameViewDtoStatusEnum;
  currentPlayerId: string | null;
  winnerId: string | null;
  turnNumber: number;
  version: number;
  pendingAction: StarfallPendingActionDto | null;
  tradeRow: StarfallCardViewDto[];
  explorersCount: number;
  unusedTradeDeckCount: number;
  scrappedCards: StarfallCardViewDto[];
  players: StarfallPlayerViewDto[];
}

export interface JoinStarfallGameDto {
  /**
   * Game state version expected by the client
   * @min 0
   * @example 0
   */
  expectedVersion: number;
}

export interface StartStarfallGameDto {
  /**
   * Unique idempotency key
   * @example "uuid"
   */
  commandId: string;
  /**
   * Game state version expected by the client
   * @min 0
   * @example 1
   */
  expectedVersion: number;
}

export enum PlayCardCommandDtoTypeEnum {
  PlayCard = "play_card",
}

export enum BuyCardCommandDtoTypeEnum {
  BuyCard = "buy_card",
}

export enum UseAbilityCommandDtoTypeEnum {
  UseAbility = "use_ability",
}

export enum ResolvePendingCommandDtoTypeEnum {
  ResolvePending = "resolve_pending",
}

export enum CancelPendingCommandDtoTypeEnum {
  CancelPending = "cancel_pending",
}

export enum AttackBaseCommandDtoTypeEnum {
  AttackBase = "attack_base",
}

export enum AttackPlayerCommandDtoTypeEnum {
  AttackPlayer = "attack_player",
}

export enum EndTurnCommandDtoTypeEnum {
  EndTurn = "end_turn",
}

export enum StarfallActionDtoNameEnum {
  ScrapCardFromHand = "scrap_card_from_hand",
  ScrapCardFromPile = "scrap_card_from_pile",
  ScrapCardFromHandOrPile = "scrap_card_from_hand_or_pile",
  ScrapCardFromTradeRow = "scrap_card_from_trade_row",
  PlusAttack = "plus_attack",
  PlusMoney = "plus_money",
  PlusAuthority = "plus_authority",
  DiscardOpponentCard = "discard_opponent_card",
  GetCards = "get_cards",
  DestroyBase = "destroy_base",
  DiscardThenDraw = "discard_then_draw",
  PutNextShipOnTop = "put_next_ship_on_top",
  AcquireShipForFreeOnTop = "acquire_ship_for_free_on_top",
  CopyShip = "copy_ship",
  AllFactionsAlly = "all_factions_ally",
  DrawPerFactionCard = "draw_per_faction_card",
  Sequence = "sequence",
  ChooseOne = "choose_one",
  IfBasesInPlay = "if_bases_in_play",
}

export enum StarfallActionDtoFractionEnum {
  Blobs = "blobs",
  Trades = "trades",
  Empire = "empire",
  Techno = "techno",
}

export enum StarfallPendingActionDtoTypeEnum {
  ChooseCardsToScrap = "choose_cards_to_scrap",
  ChooseTradeCardToScrap = "choose_trade_card_to_scrap",
  ChooseBaseToDestroy = "choose_base_to_destroy",
  DiscardThenDraw = "discard_then_draw",
  ChooseShipToCopy = "choose_ship_to_copy",
  ChooseFreeShip = "choose_free_ship",
  ChooseEffect = "choose_effect",
  DiscardForOpponent = "discard_for_opponent",
}

export enum StarfallPendingActionDtoZonesEnum {
  PlayerHand = "player-hand",
  PlayerPileDeck = "player-pile-deck",
  PlayerDeck = "player-deck",
  PlayerBases = "player-bases",
  CurrentlyPlayed = "currently-played",
  TradeRow = "trade-row",
  UnusedDeck = "unused-deck",
  Explorers = "explorers",
  StarterCards = "starter-cards",
  Scrapped = "scrapped",
}

export enum StarfallPersistentAbilityDtoTriggerEnum {
  ShipPlayed = "ship_played",
}

export enum StarfallCardViewDtoDeckEnum {
  Trade = "trade",
  Explorer = "explorer",
  Starter = "starter",
}

export enum StarfallCardViewDtoFractionEnum {
  Blobs = "blobs",
  Trades = "trades",
  Empire = "empire",
  Techno = "techno",
  None = "none",
}

export enum StarfallCardViewDtoTypeEnum {
  Ship = "ship",
  Base = "base",
}

export enum StarfallGameViewDtoStatusEnum {
  Waiting = "waiting",
  Active = "active",
  Finished = "finished",
}

export interface GetStarfallGameParams {
  gameId: string;
}

export interface JoinStarfallGameParams {
  gameId: string;
}

export interface StartStarfallGameParams {
  gameId: string;
}

export interface ExecuteStarfallCommandParams {
  gameId: string;
}
