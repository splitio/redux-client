import { splitSdk, getClient } from './asyncActions';
import { IStatus, ITrackParams } from './types';
import { ERROR_TRACK_NO_INITSPLITSDK, ERROR_MANAGER_NO_INITSPLITSDK } from './constants';
import { __getStatus, matching } from './utils';

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
    if (params.key || !(splitSdk.config.core as SplitIO.IBrowserSettings['core']).trafficType) {
      trackParams.unshift(params.trafficType);
    }
  }

  return client.track(...trackParams as [string, any]);
}

/**
 * Gets the array of feature flag names.
 *
 * @returns {string[]} The list of feature flag names. The list might be empty if the SDK was not initialized or if it's not ready yet.
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
 * Gets the data of a split in SplitView format.
 *
 * @param {string} featureFlagName The name of the split we wan't to get info of.
 * @returns {SplitView} The SplitIO.SplitView of the given split, or null if split does not exist or the SDK was not initialized or is not ready.
 *
 * @see {@link https://help.split.io/hc/en-us/articles/360038851551-Redux-SDK#manager}
 */
export function getSplit(featureFlagName: string): SplitIO.SplitView {
  if (!splitSdk.factory) {
    console.error(ERROR_MANAGER_NO_INITSPLITSDK);
    return null;
  }

  return splitSdk.factory.manager().split(featureFlagName);
}

/**
 * Gets the array of feature flags data in SplitView format.
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

/**
 * Gets an object with the status properties of the SDK client or manager:
 *
 * - `isReady` indicates if the SDK client has emitted the SDK_READY event.
 * - `isReadyFromCache` indicates if the SDK client has emitted the SDK_READY_FROM_CACHE event.
 * - `hasTimedout` indicates if the SDK client has emitted the SDK_READY_TIMED_OUT event.
 * - `isDestroyed` indicates if the SDK client has been destroyed, i.e., if the `destroySplitSdk` action was dispatched.
 *
 * @param {SplitIO.SplitKey} key To use only on client-side. Ignored in server-side. If a key is provided and a client associated to that key has been used, the status of that client is returned.
 * If no key is provided, the status of the main client and manager is returned (the main client shares the status with the manager).
 *
 * @returns {IStatus} The status of the SDK client or manager.
 *
 * @see {@link https://help.split.io/hc/en-us/articles/360038851551-Redux-SDK#subscribe-to-events}
 */
export function getStatus(key?: SplitIO.SplitKey): IStatus {
  if (splitSdk.factory) {
    const stringKey = matching(key);
    const isMainClient = splitSdk.isDetached || !stringKey || stringKey === matching((splitSdk.config as SplitIO.IBrowserSettings).core.key);
    const client = isMainClient ? splitSdk.factory.client() : splitSdk.sharedClients[stringKey];

    if (client) return __getStatus(client);
  }

  // Default status if SDK is not initialized or client is not found
  return {
    isReady: false,
    isReadyFromCache: false,
    hasTimedout: false,
    isDestroyed: false,
  };
}
