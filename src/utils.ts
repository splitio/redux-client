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

export function getStatus(client: SplitIO.IClient): IClientStatus {
  // @ts-expect-error, function exists but it is not part of JS SDK type definitions
  return client.__getStatus();
}

/**
 * Validates and sanitizes the parameters passed to the "getTreatments" action creator.
 *
 * @returns {IGetTreatmentsParams} The returned object is a copy of the passed one, with the "splitNames" property converted to an array of strings.
 */
export function validateGetTreatmentsParams(params: unknown): IGetTreatmentsParams {
  if (!isObject(params)) {
    console.log('[ERROR] "getTreatments" must be called with a param object.');
    params = {};
  }

  let { splitNames } = params as IGetTreatmentsParams;
  splitNames = validateFeatureFlags(typeof splitNames === 'string' ? [splitNames] : splitNames) || [];

  return {
    ...params as IGetTreatmentsParams,
    splitNames,
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
