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
 * Get the array of Split names.
 *
 * @returns {string[]} The list of Split names. The list might be empty if the SDK was not initialized or if it's not ready yet.
 *
 * @see {@link https://help.split.io/hc/en-us/articles/360038851551-Redux-SDK#manager}
 */
export declare function getSplitNames(): string[];
/**
 * Get the data of a split in SplitView format.
 *
 * @param {string} splitName The name of the split we wan't to get info of.
 * @returns {SplitView} The SplitIO.SplitView of the given split, or null if split does not exist or the SDK was not initialized or is not ready.
 *
 * @see {@link https://help.split.io/hc/en-us/articles/360038851551-Redux-SDK#manager}
 */
export declare function getSplit(splitName: string): SplitIO.SplitView;
/**
 * Get the array of splits data in SplitView format.
 *
 * @returns {SplitViews} The list of SplitIO.SplitView. The list might be empty if the SDK was not initialized or if it's not ready yet
 *
 * @see {@link https://help.split.io/hc/en-us/articles/360038851551-Redux-SDK#manager}
 */
export declare function getSplits(): SplitIO.SplitViews;
