import { Dispatch, Action } from 'redux';
import { IInitSplitSdkParams, IGetTreatmentsParams, IDestroySplitSdkParams, ISplitFactoryBuilder } from './types';
/**
 * Internal object SplitSdk. This object should not be accessed or
 * modified by the user, since it is not considered part of the public API
 * and may break without notice. It is used by the library for its operation.
 */
export interface ISplitSdk {
    config: SplitIO.IBrowserSettings | SplitIO.INodeSettings;
    splitio: ISplitFactoryBuilder;
    factory: SplitIO.ISDK;
    sharedClients: {
        [stringKey: string]: SplitIO.IClient;
    };
    isDetached: boolean;
    dispatch: Dispatch<Action>;
}
export declare const splitSdk: ISplitSdk;
/**
 * This action creator initializes the Split SDK. It dispatches a Thunk (async) action.
 *
 * @param {IInitSplitSdkParams} params
 */
export declare function initSplitSdk(params: IInitSplitSdkParams): (dispatch: Dispatch<Action>) => Promise<void>;
/**
 * This action creator performs a treatment evaluation, i.e., it invokes the actual `client.getTreatment*` methods.
 *
 * @param {IGetTreatmentsParams} params
 */
export declare function getTreatments(params: IGetTreatmentsParams): Action | (() => void);
/**
 * Interface of SDK client for not detached execution (browser).
 */
interface IClientNotDetached extends SplitIO.IClient {
    _trackingStatus?: boolean;
    /**
     * stored evaluations to execute on SDK update. It is an object because we might
     * want to change the evaluation parameters (i.e. attributes) per each feature flag name or flag set.
     */
    evalOnUpdate: {
        [name: string]: IGetTreatmentsParams;
    };
    /**
     * stored evaluations to execute when the SDK is ready. It is an array, so if multiple evaluations
     * are set with the same feature flag name, the result (i.e. treatment) of the last one is the stored one.
     */
    evalOnReady: IGetTreatmentsParams[];
    /**
     * Similar to evalOnReady: stored evaluations to execute when the SDK is ready from cache.
     */
    evalOnReadyFromCache: IGetTreatmentsParams[];
}
/**
 * Used in not detached version (browser). It gets an SDK client and enhances it with `evalOnUpdate`, `evalOnReady` and `evalOnReadyFromCache` lists.
 * These lists are used by `getTreatments` action creator to schedule evaluation of feature flags on SDK_UPDATE, SDK_READY and SDK_READY_FROM_CACHE events.
 * It is exported for testing purposes only.
 *
 * @param splitSdk it contains the Split factory, the store dispatch function, and other internal properties
 * @param key optional user key
 * @returns SDK client with `evalOnUpdate`, `evalOnReady` and `evalOnReadyFromCache` action lists.
 */
export declare function getClient(splitSdk: ISplitSdk, key?: SplitIO.SplitKey): IClientNotDetached;
/**
 * This action creator destroy the Split SDK. It dispatches a Thunk (async) action.
 * Once the action is resolved, any subsequent dispatch of `getTreatments`
 * will update your treatments at the store with the `control` value.
 */
export declare function destroySplitSdk(params?: IDestroySplitSdkParams): (dispatch: Dispatch<Action>) => Promise<void>;
export {};
