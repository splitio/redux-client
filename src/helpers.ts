import { splitSdk, getClient } from './asyncActions';
import { IStatus, ITrackParams } from './types';
import { ERROR_TRACK_NO_INITSPLITSDK, ERROR_MANAGER_NO_INITSPLITSDK } from './constants';
import { __getStatus, isMainClient, matching } from './utils';
import { initialStatus } from './reducer';

/**
 * This function track events, i.e., it invokes the actual `client.track*` methods.
 * This function is not an action creator, but rather a simple access to `client.track()`.
 *
 * @param params - Parameter object to track an event.
 *
 * @see {@link https://help.split.io/hc/en-us/articles/360038851551-Redux-SDK#track}
 */
export function track(params: ITrackParams): boolean {
  if (!splitSdk.factory) {
    console.error(ERROR_TRACK_NO_INITSPLITSDK);
    return false;
  }

  const { key, trafficType, eventType, value, properties } = params;

  if (splitSdk.isDetached) { // Node
    // In node, user must always provide key and TT as params
    const client = splitSdk.factory.client() as SplitIO.IClient;

    return client.track(key, trafficType, eventType, value, properties);
  } else { // Browser
    // client is a shared or main client whether or not the key is provided
    const client = getClient(splitSdk, params.key);

    return client.track(trafficType, eventType, value, properties);
  }
}

/**
 * Gets the array of feature flag names.
 *
 * @returns The list of feature flag names. The list might be empty if the SDK was not initialized or if it's not ready yet.
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
 * @param featureFlagName - The name of the feature flag we wan't to get info of.
 * @returns The SplitIO.SplitView of the given split, or null if split does not exist or the SDK was not initialized or is not ready.
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
 * @returns The list of SplitIO.SplitView. The list might be empty if the SDK was not initialized or if it's not ready yet
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
 * Gets an object with the status properties of the SDK client or manager.
 *
 * This function is similar to the `selectStatus` selector, but it does not require the Split state as a parameter since it uses the global `splitSdk` object.
 * Consider using the `selectStatus` selector instead for a more Redux-friendly approach.
 *
 * @param key - To use only on client-side. Ignored in server-side. If a key is provided and a client associated to that key has been used, the status of that client is returned.
 * If no key is provided, the status of the main client and manager is returned (the main client shares the status with the manager).
 *
 * @returns The status of the SDK client or manager.
 *
 * @see {@link https://help.split.io/hc/en-us/articles/360038851551-Redux-SDK#subscribe-to-events}
 */
export function getStatus(key?: SplitIO.SplitKey): IStatus {
  if (splitSdk.factory) {
    const stringKey = matching(key);
    const client = isMainClient(key) ? splitSdk.factory.client() : splitSdk.sharedClients[stringKey];

    if (client) return __getStatus(client);
  }

  // Default status if SDK is not initialized or client is not found. No warning logs for now, in case the helper is used before actions are dispatched
  return { ...initialStatus };
}
