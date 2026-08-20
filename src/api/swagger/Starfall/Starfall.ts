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

import type {
  AttackBaseCommandDto,
  AttackPlayerCommandDto,
  BuyCardCommandDto,
  CancelPendingCommandDto,
  CreateStarfallGameDto,
  EndTurnCommandDto,
  ExecuteStarfallCommandParams,
  GetStarfallGameParams,
  JoinStarfallGameDto,
  JoinStarfallGameParams,
  PlayCardCommandDto,
  ResolvePendingCommandDto,
  StarfallGameViewDto,
  StartStarfallGameDto,
  StartStarfallGameParams,
  UseAbilityCommandDto,
} from "./data-contracts";
import { ContentType, HttpClient, type RequestParams } from "./http-client";

export class StarfallApi<
  SecurityDataType = unknown,
> extends HttpClient<SecurityDataType> {
  /**
   * No description
   *
   * @tags Starfall
   * @name CreateStarfallGame
   * @summary Create a Starfall game
   * @request POST:/api/starfall/games
   */
  createStarfallGame = (
    data: CreateStarfallGameDto,
    params: RequestParams = {},
  ) =>
    this.request<StarfallGameViewDto, any>({
      path: `/api/starfall/games`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Starfall
   * @name GetStarfallGame
   * @summary Get private Starfall game state
   * @request GET:/api/starfall/games/{gameId}
   */
  getStarfallGame = (
    { gameId, ...query }: GetStarfallGameParams,
    params: RequestParams = {},
  ) =>
    this.request<StarfallGameViewDto, any>({
      path: `/api/starfall/games/${gameId}`,
      method: "GET",
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Starfall
   * @name JoinStarfallGame
   * @summary Join a waiting Starfall game
   * @request POST:/api/starfall/games/{gameId}/join
   */
  joinStarfallGame = (
    { gameId, ...query }: JoinStarfallGameParams,
    data: JoinStarfallGameDto,
    params: RequestParams = {},
  ) =>
    this.request<StarfallGameViewDto, any>({
      path: `/api/starfall/games/${gameId}/join`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Starfall
   * @name StartStarfallGame
   * @summary Start a Starfall game
   * @request POST:/api/starfall/games/{gameId}/start
   */
  startStarfallGame = (
    { gameId, ...query }: StartStarfallGameParams,
    data: StartStarfallGameDto,
    params: RequestParams = {},
  ) =>
    this.request<StarfallGameViewDto, any>({
      path: `/api/starfall/games/${gameId}/start`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Starfall
   * @name ExecuteStarfallCommand
   * @summary Execute a Starfall game command
   * @request POST:/api/starfall/games/{gameId}/commands
   */
  executeStarfallCommand = (
    { gameId, ...query }: ExecuteStarfallCommandParams,
    data:
      | PlayCardCommandDto
      | BuyCardCommandDto
      | UseAbilityCommandDto
      | ResolvePendingCommandDto
      | CancelPendingCommandDto
      | AttackBaseCommandDto
      | AttackPlayerCommandDto
      | EndTurnCommandDto,
    params: RequestParams = {},
  ) =>
    this.request<StarfallGameViewDto, void>({
      path: `/api/starfall/games/${gameId}/commands`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
}

const instance = new StarfallApi();

export const useStarfall = () => {
  return {
    createStarfallGame: instance.createStarfallGame,
    getStarfallGame: instance.getStarfallGame,
    joinStarfallGame: instance.joinStarfallGame,
    startStarfallGame: instance.startStarfallGame,
    executeStarfallCommand: instance.executeStarfallCommand,
  };
};
