import { ITrackParams } from './types';
/**
 * This function track events, i.e., it invokes the actual `client.track*` methods.
 * This function is not an action creator, but rather a simple access to `client.track()`.
 *
 * @param {ITrackParams} params
 *
 * @see {@link https://help.split.io/hc/en-us/articles/360038851551-Redux-SDK#track}
 */
export declare function track(params: ITrackParams): boolean;
/**
 * Get the array of featureFlag names.
 *
 * @returns {string[]} The list of feature flag names. The list might be empty if the SDK was not initialized or if it's not ready yet.
 *
 * @see {@link https://help.split.io/hc/en-us/articles/360038851551-Redux-SDK#manager}
 */
export declare function getSplitNames(): string[];
/**
 * Get the data of a featureFlag in SplitView format.
 *
 * @param {string} featureFlag The name of the feature flag we want to get info of.
 * @returns {SplitView} The SplitIO.SplitView of the given feature flag, or null if feature flag does not exist or the SDK was not initialized or is not ready.
 *
 * @see {@link https://help.split.io/hc/en-us/articles/360038851551-Redux-SDK#manager}
 */
export declare function getSplit(featureFlag: string): SplitIO.SplitView;
/**
 * Get the array of featureFlags data in SplitView format.
 *
 * @returns {SplitViews} The list of SplitIO.SplitView. The list might be empty if the SDK was not initialized or if it's not ready yet
 *
 * @see {@link https://help.split.io/hc/en-us/articles/360038851551-Redux-SDK#manager}
 */
export declare function getSplits(): SplitIO.SplitViews;
