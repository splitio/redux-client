import { splitSdk, getClient } from './asyncActions';
import { ITrackParams } from './types';
import { ERROR_TRACK_NO_INITSPLITSDK, ERROR_MANAGER_NO_INITSPLITSDK } from './constants';

/**
 * This function track events, i.e., it invokes the actual `client.track*` methods.
 * This function is not an action creator, but rather a simple access to `client.track()`.
 *
 * @param {ITrackParams} params
 *
 * @see {@link https://help.split.io/hc/en-us/articles/360038851551-Redux-SDK#track}
 */
export function track(params: ITrackParams): boolean {
  if (!splitSdk.factory) {
    console.error(ERROR_TRACK_NO_INITSPLITSDK);
    return false;
  }
  const trackParams = [params.eventType, params.value, params.properties];
  let client; // Client getting variates depending on browser or node.

  if (splitSdk.isDetached) { // Node
    // In node, user must always provide key and TT as params
    client = splitSdk.factory.client();
    trackParams.unshift(params.key, params.trafficType);
  } else { // Browser
    // client is a shared or main client whether or not the key is provided
    client = getClient(splitSdk, params.key);

    // TT is required if the key is provided (shared client) or if not present in config (main client)
    if (params.key || !(splitSdk.config.core as any).trafficType) {
      trackParams.unshift(params.trafficType);
    }
  }

  return client.track(...trackParams as [string, any]);
}

/**
 * Get the array of Split names.
 *
 * @returns {string[]} The list of Split names. The list might be empty if the SDK was not initialized or if it's not ready yet.
 *
 * @see {@link https://help.split.io/hc/en-us/articles/360038851551-Redux-SDK#manager}
 */
export function getSplitNames(): string[] {
  if (!splitSdk.factory) {
    console.error(ERROR_MANAGER_NO_INITSPLITSDK);
    return [];
  }

  return splitSdk.factory.manager().names();
}

/**
 * Get the data of a split in SplitView format.
 *
 * @param {string} splitName The name of the split we wan't to get info of.
 * @returns {SplitView} The SplitIO.SplitView of the given split, or null if split does not exist or the SDK was not initialized or is not ready.
 *
 * @see {@link https://help.split.io/hc/en-us/articles/360038851551-Redux-SDK#manager}
 */
export function getSplit(splitName: string): SplitIO.SplitView {
  if (!splitSdk.factory) {
    console.error(ERROR_MANAGER_NO_INITSPLITSDK);
    return null;
  }

  return splitSdk.factory.manager().split(splitName);
}

/**
 * Get the array of splits data in SplitView format.
 *
 * @returns {SplitViews} The list of SplitIO.SplitView. The list might be empty if the SDK was not initialized or if it's not ready yet
 *
 * @see {@link https://help.split.io/hc/en-us/articles/360038851551-Redux-SDK#manager}
 */
export function getSplits(): SplitIO.SplitViews {
  if (!splitSdk.factory) {
    console.error(ERROR_MANAGER_NO_INITSPLITSDK);
    return [];
  }

  return splitSdk.factory.manager().splits();
}
