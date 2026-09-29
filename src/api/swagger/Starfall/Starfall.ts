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
  GetStarfallGamesParams,
  GetStarfallLobbyParams,
  JoinStarfallGameDto,
  JoinStarfallGameParams,
  PlayCardCommandDto,
  ResolvePendingCommandDto,
  StarfallGameListItemDto,
  StarfallGameViewDto,
  StarfallLobbyDto,
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
   * @secure
   */
  createStarfallGame = (
    data: CreateStarfallGameDto,
    params: RequestParams = {},
  ) =>
    this.request<StarfallGameViewDto, any>({
      path: `/api/starfall/games`,
      method: "POST",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Starfall
   * @name GetStarfallGames
   * @summary Get Starfall games ordered from newest to oldest
   * @request GET:/api/starfall/games
   * @secure
   */
  getStarfallGames = (
    query: GetStarfallGamesParams,
    params: RequestParams = {},
  ) =>
    this.request<StarfallGameListItemDto[], any>({
      path: `/api/starfall/games`,
      method: "GET",
      query: query,
      secure: true,
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
   * @secure
   */
  getStarfallGame = (
    { gameId, ...query }: GetStarfallGameParams,
    params: RequestParams = {},
  ) =>
    this.request<StarfallGameViewDto, any>({
      path: `/api/starfall/games/${gameId}`,
      method: "GET",
      secure: true,
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
   * @secure
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
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Starfall
   * @name GetStarfallLobby
   * @summary Get lobby details without private cards
   * @request GET:/api/starfall/games/{gameId}/lobby
   * @secure
   */
  getStarfallLobby = (
    { gameId, ...query }: GetStarfallLobbyParams,
    params: RequestParams = {},
  ) =>
    this.request<StarfallLobbyDto, any>({
      path: `/api/starfall/games/${gameId}/lobby`,
      method: "GET",
      secure: true,
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
   * @secure
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
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
}

const instance = new StarfallApi();

export const useStarfall = () => {
  return {
    createStarfallGame: instance.createStarfallGame,
    getStarfallGames: instance.getStarfallGames,
    getStarfallGame: instance.getStarfallGame,
    joinStarfallGame: instance.joinStarfallGame,
    getStarfallLobby: instance.getStarfallLobby,
    executeStarfallCommand: instance.executeStarfallCommand,
  };
};
