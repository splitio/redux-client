import { ERROR_GETT_NO_PARAM_OBJECT, WARN_FEATUREFLAGS_AND_FLAGSETS } from './constants';
import { IGetTreatmentsParams } from './types';

/**
 * Validates if a value is an object.
 */
export function isObject(obj: unknown) {
  return obj && typeof obj === 'object' && obj.constructor === Object;
}

/**
 * Verify type of key and return either its matchingKey or itself
 */
export function matching(key: SplitIO.SplitKey): string {
  return isObject(key) ? (key as SplitIO.SplitKeyObject).matchingKey : (key as string);
}

// The following utils might be removed in the future, if the JS SDK extends its public API with a "getStatus" method

/**
 * ClientWithContext interface.
 */
export interface IClientStatus {
  isReady: boolean;
  isReadyFromCache: boolean;
  isOperational: boolean;
  hasTimedout: boolean;
  isDestroyed: boolean;
}

export function __getStatus(client: SplitIO.IClient): IClientStatus {
  // @ts-expect-error, function exists but it is not part of JS SDK type definitions
  return client.__getStatus();
}

/**
 * Validates and sanitizes the parameters passed to the "getTreatments" action creator.
 * The returned object is a copy of the passed one, with the "splitNames" and "flagSets" properties converted to an array of strings.
 */
export function validateGetTreatmentsParams(params: any): IGetTreatmentsParams | false {
  if (!isObject(params) || (!params.splitNames && !params.flagSets)) {
    console.log(ERROR_GETT_NO_PARAM_OBJECT);
    return false;
  }

  let { splitNames, flagSets } = params;

  if (splitNames) {
    // Feature flag names are sanitized because they are passed to the getControlTreatmentsWithConfig function.
    splitNames = validateFeatureFlags(typeof splitNames === 'string' ? [splitNames] : splitNames);
    if (!splitNames) {
      console.log(ERROR_GETT_NO_PARAM_OBJECT);
      return false;
    }

    // Ignore flagSets if splitNames are provided
    if (flagSets) console.log(WARN_FEATUREFLAGS_AND_FLAGSETS);
    flagSets = undefined;
  } else {
    // Flag set names are not sanitized, because they are not used by Redux SDK directly. We just make sure it is an array.
    flagSets = typeof flagSets === 'string' ? [flagSets] : flagSets;
    if (!Array.isArray(flagSets)) {
      console.log(ERROR_GETT_NO_PARAM_OBJECT);
      return false;
    }
  }

  return {
    ...params,
    splitNames,
    flagSets,
  };
}

// The following input validation utils are based on the ones in the React SDK. They might be replaced by utils from the JS SDK in the future.

function validateFeatureFlags(maybeFeatureFlags: unknown, listName = 'feature flag names'): false | string[] {
  if (Array.isArray(maybeFeatureFlags) && maybeFeatureFlags.length > 0) {
    const validatedArray: string[] = [];
    // Remove invalid values
    maybeFeatureFlags.forEach((maybeFeatureFlag) => {
      const featureFlagName = validateFeatureFlag(maybeFeatureFlag);
      if (featureFlagName) validatedArray.push(featureFlagName);
    });

    // Strip off duplicated values if we have valid feature flag names then return
    if (validatedArray.length) return uniq(validatedArray);
  }

  console.log(`[ERROR] ${listName} must be a non-empty array.`);
  return false;
}

const TRIMMABLE_SPACES_REGEX = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/;

function validateFeatureFlag(maybeFeatureFlag: unknown, item = 'feature flag name'): false | string {
  if (maybeFeatureFlag == undefined) {
    console.log(`[ERROR] you passed a null or undefined ${item}, ${item} must be a non-empty string.`);
  } else if (!isString(maybeFeatureFlag)) {
    console.log(`[ERROR] you passed an invalid ${item}, ${item} must be a non-empty string.`);
  } else {
    if (TRIMMABLE_SPACES_REGEX.test(maybeFeatureFlag)) {
      console.log(`[WARN] ${item} "${maybeFeatureFlag}" has extra whitespace, trimming.`);
      maybeFeatureFlag = maybeFeatureFlag.trim();
    }

    if ((maybeFeatureFlag as string).length > 0) {
      return maybeFeatureFlag as string;
    } else {
      console.log(`[ERROR] you passed an empty ${item}, ${item} must be a non-empty string.`);
    }
  }

  return false;
}

/**
 * Removes duplicate items on an array of strings.
 */
function uniq(arr: string[]): string[] {
  const seen: Record<string, boolean> = {};
  return arr.filter((item) => {
    return Object.prototype.hasOwnProperty.call(seen, item) ? false : seen[item] = true;
  });
}

/**
 * Checks if a given value is a string.
 */
function isString(val: unknown): val is string {
  return typeof val === 'string' || val instanceof String;
}
