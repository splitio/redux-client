import { SplitFactory } from '@splitsoftware/splitio';
import { SplitFactory as SplitFactoryForLocalhost } from '@splitsoftware/splitio/client';
import { Dispatch, Action } from 'redux';
import { IInitSplitSdkParams, IGetTreatmentsParams, IDestroySplitSdkParams, ISplitFactoryBuilder } from './types';
import { splitReady, splitReadyWithEvaluations, splitReadyFromCache, splitReadyFromCacheWithEvaluations, splitTimedout, splitUpdate, splitUpdateWithEvaluations, splitDestroy, addTreatments } from './actions';
import { VERSION, ERROR_GETT_NO_INITSPLITSDK, ERROR_DESTROY_NO_INITSPLITSDK, getControlTreatmentsWithConfig } from './constants';
import { matching, __getStatus, validateGetTreatmentsParams, isMainClient } from './utils';

/**
 * Internal object SplitSdk. This object should not be accessed or
 * modified by the user, since it is not considered part of the public API
 * and may break without notice. It is used by the library for its operation.
 */
export interface ISplitSdk {
  config: SplitIO.IBrowserSettings | SplitIO.INodeSettings;
  splitio: ISplitFactoryBuilder;
  factory: SplitIO.ISDK;
  sharedClients: { [stringKey: string]: SplitIO.IClient };
  isDetached: boolean; // true: server-side, false: client-side (i.e., client with bound key)
  dispatch: Dispatch<Action>;
}

export const splitSdk: ISplitSdk = {
  config: null,
  splitio: null,
  factory: null,
  sharedClients: {},
  isDetached: false,
  dispatch: null,
};

/**
 * This action creator initializes the Split SDK. It dispatches a Thunk (async) action.
 *
 * @param {IInitSplitSdkParams} params
 */
export function initSplitSdk(params: IInitSplitSdkParams): (dispatch: Dispatch<Action>) => Promise<void> {

  splitSdk.config = params.config;

  splitSdk.splitio = params.splitio ||
    // For client-side localhost mode, we need to use the client-side SDK, to support test runners that execute in NodeJS
    (splitSdk.config?.core?.authorizationKey === 'localhost' && typeof splitSdk.config?.features === 'object' ?
      SplitFactoryForLocalhost :
      SplitFactory) as ISplitFactoryBuilder;

  // SDK factory and client initialization
  // @ts-expect-error. 2nd param is not part of type definitions. Used to overwrite the version of the SDK for correct tracking.
  splitSdk.factory = splitSdk.splitio(splitSdk.config, (modules) => {
    // `nodejs-x.x.x` => server-side/detached client, `javascript-x.x.x` => client-side/no detached client
    splitSdk.isDetached = modules.settings.version.includes('nodejs');
    modules.settings.version = VERSION;
  });

  const defaultClient = splitSdk.isDetached ? splitSdk.factory.client() : getClient(splitSdk);

  // Add callback listeners. They are attached outside the thunk action, since on server-side the
  // store has a life-span per session/request and thus the action is dispatched more than once
  if (params.onReady) defaultClient.once(defaultClient.Event.SDK_READY, params.onReady);
  if (params.onReadyFromCache) defaultClient.once(defaultClient.Event.SDK_READY_FROM_CACHE, params.onReadyFromCache);
  if (params.onTimedout) defaultClient.once(defaultClient.Event.SDK_READY_TIMED_OUT, params.onTimedout);
  if (params.onUpdate) defaultClient.on(defaultClient.Event.SDK_UPDATE, params.onUpdate);

  // Return Thunk (async) action
  return (dispatch: Dispatch<Action>): Promise<void> => {

    const status = __getStatus(defaultClient);

    if (status.hasTimedout) dispatch(splitTimedout(status.lastUpdate)); // dispatched before `splitReady`, since it overwrites `isTimedout` property
    if (status.isReady) dispatch(splitReady(status.lastUpdate));
    if (status.isDestroyed) dispatch(splitDestroy(status.lastUpdate));

    if (!splitSdk.isDetached) {  // Split SDK running in Browser
      // save the dispatch function, needed on browser to dispatch `getTreatment` actions on SDK_READY and SDK_UPDATE events
      // we do it before instantiating the client via `getClient`, to guarantee the reference of the dispatch function in `splitSdk`
      // @TODO possible refactor: no need to save the dispatch function if `getTreatments` return a thunk instead of a plain action
      splitSdk.dispatch = dispatch;
      if (status.isReadyFromCache) dispatch(splitReadyFromCache(status.lastUpdate));
    }

    // Return the client ready promise so that the user can call .then() on async dispatch result and wait until ready.
    return defaultClient.ready();
  };
}

/**
 * Util that reduce the results of multiple calls to `client.getTreatmentsWithConfig` method into a single `SplitIO.TreatmentsWithConfig` object.
 *
 * @param client Sdk client to call
 * @param evalParams validated list of evaluation params
 */
function __getTreatments(client: IClientNotDetached, evalParams: IGetTreatmentsParams[]): SplitIO.TreatmentsWithConfig {
  return evalParams.reduce((acc, params) => {
    return {
      ...acc,
      ...(params.splitNames ?
        client.getTreatmentsWithConfig(params.splitNames as string[], params.attributes) :
        client.getTreatmentsWithConfigByFlagSets(params.flagSets as string[], params.attributes)
      )
    };
  }, {});
}

/**
 * This action creator performs a treatment evaluation, i.e., it invokes the actual `client.getTreatment*` methods.
 *
 * @param {IGetTreatmentsParams} params
 */
export function getTreatments(params: IGetTreatmentsParams): Action | (() => void) {

  // Log error message if the SDK was not initiated with a `initSplitSdk` action
  if (!splitSdk.factory) {
    console.error(ERROR_GETT_NO_INITSPLITSDK);
    return () => { };
  }

  params = validateGetTreatmentsParams(params) as IGetTreatmentsParams;
  if (!params) return () => { };

  const splitNames = params.splitNames as string[];
  const flagSets = params.flagSets as string[];

  if (!splitSdk.isDetached) { // Split SDK running in Browser

    const client = getClient(splitSdk, params.key);

    // Register or unregister the current `getTreatments` action from being re-executed on SDK_UPDATE.
    if (params.evalOnUpdate) {
      splitNames && splitNames.forEach((featureFlagName) => {
        client.evalOnUpdate[`flag::${featureFlagName}`] = { ...params, splitNames: [featureFlagName] } as IGetTreatmentsParams;
      });
      flagSets && flagSets.forEach((flagSetName) => {
        client.evalOnUpdate[`set::${flagSetName}`] = { ...params, flagSets: [flagSetName] } as IGetTreatmentsParams;
      });
    } else {
      splitNames && splitNames.forEach((featureFlagName) => {
        delete client.evalOnUpdate[`flag::${featureFlagName}`];
      });
      flagSets && flagSets.forEach((flagSetName) => {
        delete client.evalOnUpdate[`set::${flagSetName}`];
      });
    }

    const status = __getStatus(client);

    // If the SDK is not ready, it stores the action to execute when ready
    if (!status.isReady) {
      client.evalOnReady.push(params);
    }

    // @TODO breaking: consider removing `evalOnReadyFromCache` config option, since `false` value has no effect on shared clients (they are ready from cache immediately) and on the main client if its ready from cache when `getTreatments` is called
    // If the SDK is not ready from cache and flag `evalOnReadyFromCache`, it stores the action to execute when ready from cache
    if (!status.isReadyFromCache && params.evalOnReadyFromCache) {
      client.evalOnReadyFromCache.push(params);
    }

    if (status.isOperational) {
      // If the SDK is operational (i.e., it is ready or ready from cache), it evaluates and adds treatments to the store
      const treatments = __getTreatments(client, [params]);
      return addTreatments(params.key || (splitSdk.config as SplitIO.IBrowserSettings).core.key, treatments);
    } else {
      // Otherwise, it adds control treatments to the store, without calling the SDK (no impressions sent)
      // With flag sets, an empty object is passed since we don't know their feature flag names
      // @TODO remove eventually to minimize state changes
      return addTreatments(params.key || (splitSdk.config as SplitIO.IBrowserSettings).core.key, splitNames ? getControlTreatmentsWithConfig(splitNames) : {});
    }

  } else { // Split SDK running in Node

    // Evaluate Split and return redux action.
    const client = splitSdk.factory.client();
    const treatments = splitNames ?
      client.getTreatmentsWithConfig(params.key, splitNames, params.attributes) :
      client.getTreatmentsWithConfigByFlagSets(params.key, flagSets, params.attributes);
    return addTreatments(params.key, treatments);

  }
}

/**
 * Interface of SDK client for not detached execution (browser).
 */
interface IClientNotDetached extends SplitIO.IClient {
  _trackingStatus?: boolean;
  /**
   * stored evaluations to execute on SDK update. It is an object because we might
   * want to change the evaluation parameters (i.e. attributes) per each feature flag name or flag set.
   */
  evalOnUpdate: { [name: string]: IGetTreatmentsParams };
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
export function getClient(splitSdk: ISplitSdk, key?: SplitIO.SplitKey): IClientNotDetached {

  const stringKey = matching(key);
  // we cannot simply use `stringKey` to get the client, since the main one could have been created with a bucketing key and/or a traffic type.
  const client = (isMainClient(key) ? splitSdk.factory.client() : splitSdk.factory.client(stringKey)) as IClientNotDetached;

  if (client._trackingStatus) return client;

  if (!isMainClient(key)) splitSdk.sharedClients[stringKey] = client;
  client._trackingStatus = true;
  client.evalOnUpdate = {}; // getTreatment actions stored to execute on SDK update
  client.evalOnReady = []; // getTreatment actions stored to execute when the SDK is ready
  client.evalOnReadyFromCache = []; // getTreatment actions stored to execute when the SDK is ready from cache

  // we can use event listeners, since all clients are created via the `getClient` function:

  // On SDK ready, evaluate the registered `getTreatments` actions and dispatch `splitReady` action
  client.once(client.Event.SDK_READY, function onReady() {
    if (!splitSdk.dispatch) return;

    const lastUpdate = __getStatus(client).lastUpdate;
    if (client.evalOnReady.length) {
      const treatments = __getTreatments(client, client.evalOnReady);

      splitSdk.dispatch(splitReadyWithEvaluations(key || (splitSdk.config as SplitIO.IBrowserSettings).core.key, treatments, lastUpdate, key && true));
    } else {
      splitSdk.dispatch(splitReady(lastUpdate, key));
    }
  });

  // On SDK timed out, dispatch `splitTimedout` action
  client.once(client.Event.SDK_READY_TIMED_OUT, function onTimedout() {
    if (splitSdk.dispatch) splitSdk.dispatch(splitTimedout(__getStatus(client).lastUpdate, key));
  });

  // On SDK ready from cache, dispatch `splitReadyFromCache` action
  const status = __getStatus(client);
  if (status.isReadyFromCache) { // can be true immediately for shared clients
    if (splitSdk.dispatch) splitSdk.dispatch(splitReadyFromCache(status.lastUpdate, key));
  } else {
    client.once(client.Event.SDK_READY_FROM_CACHE, function onReadyFromCache() {
      if (!splitSdk.dispatch) return;

      const lastUpdate = __getStatus(client).lastUpdate;
      if (client.evalOnReadyFromCache.length) {
        const treatments = __getTreatments(client, client.evalOnReadyFromCache);

        splitSdk.dispatch(splitReadyFromCacheWithEvaluations(key || (splitSdk.config as SplitIO.IBrowserSettings).core.key, treatments, lastUpdate, key && true));
      } else {
        splitSdk.dispatch(splitReadyFromCache(lastUpdate, key));
      }
    });
  }

  // On SDK update, evaluate the registered `getTreatments` actions and dispatch `splitUpdate` action
  client.on(client.Event.SDK_UPDATE, function onUpdate() {
    if (!splitSdk.dispatch) return;

    const lastUpdate = __getStatus(client).lastUpdate;
    const evalOnUpdate = Object.values(client.evalOnUpdate);
    if (evalOnUpdate.length) {
      const treatments = __getTreatments(client, evalOnUpdate);

      splitSdk.dispatch(splitUpdateWithEvaluations(key || (splitSdk.config as SplitIO.IBrowserSettings).core.key, treatments, lastUpdate, key && true));
    } else {
      splitSdk.dispatch(splitUpdate(lastUpdate, key));
    }
  });

  return client;
}

/**
 * This action creator destroy the Split SDK. It dispatches a Thunk (async) action.
 * Once the action is resolved, any subsequent dispatch of `getTreatments`
 * will update your treatments at the store with the `control` value.
 */
export function destroySplitSdk(params: IDestroySplitSdkParams = {}): (dispatch: Dispatch<Action>) => Promise<void> {
  // Log error message if the SDK was not initiated with a `initSplitSdk` action
  if (!splitSdk.factory) {
    console.error(ERROR_DESTROY_NO_INITSPLITSDK);
    return () => Promise.resolve();
  }

  // Destroy the client(s) outside the thunk action, since on server-side the action is not dispatched
  // because stores have a life-span per session/request and there may not be one when server shuts down.
  const mainClient = splitSdk.factory.client();
  // in node, `splitSdk.sharedClients` is an empty object
  const sharedClients = splitSdk.sharedClients;
  const destroyPromises = Object.keys(sharedClients).map((clientKey) => sharedClients[clientKey].destroy());
  destroyPromises.push(mainClient.destroy());

  // Add onDestroy callback listener. It is important for server-side, where the thunk action is not dispatched
  // and so the user cannot access the promise as follows: `store.dispatch(destroySplitSdk()).then(...)`
  let dispatched = false;
  if (params.onDestroy) Promise.all(destroyPromises).then(() => {
    // condition to avoid calling the callback twice, since it should be called preferably after the action has been dispatched
    if (!dispatched) params.onDestroy();
  });

  // Return Thunk (async) action
  return (dispatch: Dispatch<Action>): Promise<void> => {
    dispatched = true;
    return Promise.all(destroyPromises).then(function () {
      dispatch(splitDestroy(__getStatus(mainClient).lastUpdate));
      if (params.onDestroy) params.onDestroy();
    });
  };
}
