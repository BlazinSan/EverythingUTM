/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as accounts from "../accounts.js";
import type * as appState from "../appState.js";
import type * as bugReports from "../bugReports.js";
import type * as campusPlaces from "../campusPlaces.js";
import type * as chats from "../chats.js";
import type * as files from "../files.js";
import type * as marketplace from "../marketplace.js";
import type * as profileReviews from "../profileReviews.js";
import type * as profiles from "../profiles.js";
import type * as questions from "../questions.js";
import type * as requests from "../requests.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  accounts: typeof accounts;
  appState: typeof appState;
  bugReports: typeof bugReports;
  campusPlaces: typeof campusPlaces;
  chats: typeof chats;
  files: typeof files;
  marketplace: typeof marketplace;
  profileReviews: typeof profileReviews;
  profiles: typeof profiles;
  questions: typeof questions;
  requests: typeof requests;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
