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

import type { HealthcheckEnum } from "./data-contracts";
import { HttpClient, type RequestParams } from "./http-client";

export class AppApi<
  SecurityDataType = unknown,
> extends HttpClient<SecurityDataType> {
  /**
   * No description
   *
   * @tags App
   * @name Healthcheck
   * @summary Check API availability
   * @request GET:/api/healthcheck
   */
  healthcheck = (params: RequestParams = {}) =>
    this.request<HealthcheckEnum, any>({
      path: `/api/healthcheck`,
      method: "GET",
      ...params,
    });
}

const instance = new AppApi();

export const useApp = () => {
  return {
    healthcheck: instance.healthcheck,
  };
};
