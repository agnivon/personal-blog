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
import type * as _lib_adk_agents from "../_lib/adk/agents.js";
import type * as _lib_adk_image from "../_lib/adk/image.js";
import type * as _lib_adk_index from "../_lib/adk/index.js";
import type * as _lib_adk_models from "../_lib/adk/models.js";
import type * as _lib_adk_prompts from "../_lib/adk/prompts.js";
import type * as _lib_adk_sanity_publisher from "../_lib/adk/sanity_publisher.js";
import type * as _lib_adk_types from "../_lib/adk/types.js";
import type * as _lib_adk_workflow from "../_lib/adk/workflow.js";
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
  "_lib/adk/agents": typeof _lib_adk_agents;
  "_lib/adk/image": typeof _lib_adk_image;
  "_lib/adk/index": typeof _lib_adk_index;
  "_lib/adk/models": typeof _lib_adk_models;
  "_lib/adk/prompts": typeof _lib_adk_prompts;
  "_lib/adk/sanity_publisher": typeof _lib_adk_sanity_publisher;
  "_lib/adk/types": typeof _lib_adk_types;
  "_lib/adk/workflow": typeof _lib_adk_workflow;
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
