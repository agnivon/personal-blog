/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as _constants_prompts from "../_constants/prompts.js";
import type * as _lib_sanity from "../_lib/sanity.js";
import type * as actions from "../actions.js";
import type * as crons from "../crons.js";
import type * as jobs from "../jobs.js";
import type * as queries from "../queries.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  "_constants/prompts": typeof _constants_prompts;
  "_lib/sanity": typeof _lib_sanity;
  actions: typeof actions;
  crons: typeof crons;
  jobs: typeof jobs;
  queries: typeof queries;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
