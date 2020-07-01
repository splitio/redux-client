import { SplitFactory } from '@splitsoftware/splitio';
import { Dispatch, Action } from 'redux';
import { IInitSplitSdkParams, IGetTreatmentsParams, ISplitFactoryBuilder } from './types';
import { splitReady, splitReadyFromCache, splitTimedout, splitUpdate, splitDestroy, addTreatments } from './actions';
import { VERSION, ERROR_GETT_NO_INITSPLITSDK, ERROR_DESTROY_NO_INITSPLITSDK, getControlTreatmentsWithConfig } from './constants';
import { matching, getIsReady, getIsOperational, getHasTimedout, getIsDestroyed } from './utils';

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
  isDetached: boolean;
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

function isDetached(factory: SplitIO.ISDK) {
  return factory.settings.version.includes('nodejs');
}

/**
 * This action creator initializes the Split SDK. It dispatches a Thunk (async) action.
 *
 * @param {IInitSplitSdkParams} params
 */
export function initSplitSdk(params: IInitSplitSdkParams): (dispatch: Dispatch<Action>) => Promise<void> {

  splitSdk.config = params.config;
  splitSdk.splitio = params.splitio || (SplitFactory as ISplitFactoryBuilder);

  // SDK factory and client initialization
  splitSdk.factory = splitSdk.splitio(splitSdk.config);
  splitSdk.isDetached = isDetached(splitSdk.factory);

  // Already checked if detached or not, so we'll proceed with overriding the language of the SDK for correct tracking. Don't try this at home.
  (splitSdk.factory.settings.version as any) = VERSION;

  // @TODO add comments
  const defaultClient = splitSdk.factory.client();

  // Add callback listeners
  if (params.onReady) defaultClient.once(defaultClient.Event.SDK_READY, params.onReady);
  if (params.onTimedout) defaultClient.once(defaultClient.Event.SDK_READY_TIMED_OUT, params.onTimedout);
  if (params.onUpdate) defaultClient.on(defaultClient.Event.SDK_UPDATE, params.onUpdate);

  // Return Thunk (async) action
  return (dispatch: Dispatch<Action>): Promise<void> => {

    if (splitSdk.isDetached) {  // Split SDK running in Node
      // Dispatch actions for updating Split SDK status.
      // Since on server-side the store has a life-span per session/request,
      // we cannot dispatch actions asynchronously using the client ready promise or event listeners.
      if (getHasTimedout(defaultClient)) dispatch(splitTimedout());
      if (getIsReady(defaultClient)) dispatch(splitReady());
      if (getIsDestroyed(defaultClient)) dispatch(splitDestroy());

    } else {
      // save the dispatch function, needed on browser to dispatch `getTreatment` actions on SDK_READY and SDK_UPDATE events
      // we do it before instantiating the client via `getClient`, to guarantee the reference of the dispatch function in `splitSdk`
      // @TODO possible refactor: no need to save the dispatch function if `getTreatments` return a thunk instead of a plain action
      splitSdk.dispatch = dispatch;
      // @TODO add comment
      getClient(splitSdk);
    }

    // Return the client ready promise so that the user can call .then() on async dispatch result and wait until ready.
    return defaultClient.ready();
  };
}

function __getTreatments(client: IClientNotDetached, params: IGetTreatmentsParams) {
  const treatments = client.getTreatmentsWithConfig((params.splitNames as string[]), params.attributes);

  return addTreatments(params.key || (splitSdk.config as SplitIO.IBrowserSettings).core.key, treatments);
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

  // Convert string split name to a one item array.
  if (typeof params.splitNames === 'string') {
    params.splitNames = [params.splitNames];
  }

  if (!splitSdk.isDetached) { // Split SDK running in Browser

    const client = getClient(splitSdk, params.key);

    // Register or unregister the current `getTreatments` action from being re-executed on SDK_UPDATE.
    if (params.evalOnUpdate) {
      params.splitNames.forEach((splitName) => {
        client.evalOnUpdate[splitName] = { ...params, splitNames: [splitName] };
      });
    } else {
      params.splitNames.forEach((splitName) => {
        delete client.evalOnUpdate[splitName];
      });
    }

    // If the SDK is not ready, it stores the action to execute when ready
    if (!getIsReady(client)) {
      client.evalOnReady.push(params);
    }
    if (getIsOperational(client)) {
      // If the SDK is operational (i.e., it is ready or ready from cache), it evaluates and adds treatments to the store
      return __getTreatments(client, params);
    } else {
      // Otherwise, it adds control treatments to the store, without calling the SDK (no impressions sent)
      return addTreatments(params.key || (splitSdk.config as SplitIO.IBrowserSettings).core.key, getControlTreatmentsWithConfig(params.splitNames));
    }

  } else { // Split SDK running in Node

    // Evaluate Split and return redux action.
    const client = splitSdk.factory.client();
    const treatments = client.getTreatmentsWithConfig(params.key, params.splitNames, params.attributes);
    return addTreatments(params.key, treatments);

  }
}

/**
 * Interface of SDK client for not detached execution (browser).
 */
interface IClientNotDetached extends SplitIO.IClient {
  _trackingStatus?: boolean;
  isReady: boolean;
  isReadyFromCache: boolean;
  evalOnUpdate: { [splitNameSplitKeyPair: string]: IGetTreatmentsParams }; // redoOnUpdateOrReady
  evalOnReady: IGetTreatmentsParams[]; // waitUntilReady
}

/**
 * Used in not detached version (browser). It gets an SDK client and enhances it with `evalOnUpdate` and `evalOnReady` lists.
 * This lists are used by `getTreatments` action creator to schedule evaluation of splits on SDK_READY and SDK_UPDATE events.
 * It is exported for testing purposes only.
 *
 * @param splitSdk it contains the Split factory, the store dispatch function, and other internal properties
 * @param key optional user key
 * @returns SDK client with `evalOnUpdate` and `evalOnReady` action lists.
 */
export function getClient(splitSdk: ISplitSdk, key?: SplitIO.SplitKey): IClientNotDetached {

  const stringKey = matching(key);
  const isMainClient = !stringKey || stringKey === matching((splitSdk.config as SplitIO.IBrowserSettings).core.key);
  // we cannot simply use `stringKey` to get the client, since the main one could have been created with a bucketing key and/or a traffic type.
  const client = (isMainClient ? splitSdk.factory.client() : splitSdk.factory.client(stringKey)) as IClientNotDetached;

  if (client._trackingStatus) return client;

  if (!isMainClient) splitSdk.sharedClients[stringKey] = client;
  client._trackingStatus = true;
  client.evalOnUpdate = {}; // getTreatment actions stored to execute on SDK update
  client.evalOnReady = []; // getTreatment actions stored to execute when the SDK is ready

  // we can use event listeners, since all clients are created via the `getClient` function:

  // On SDK ready, evaluate the registered `getTreatments` actions and dispatch `splitReady` action for the main client
  function onReady() {
    if (!key) splitSdk.dispatch(splitReady());
    client.evalOnReady.forEach((params) =>
      splitSdk.dispatch(__getTreatments(client, params)),
    );
  }
  client.once(client.Event.SDK_READY, onReady);

  // On SDK timed out, dispatch `splitTimedout` action for the main client
  client.once(client.Event.SDK_READY_TIMED_OUT, function() {
    if (!key) splitSdk.dispatch(splitTimedout());
    // register a listener for SDK_READY event, that might trigger after a timeout
    client.once(client.Event.SDK_READY, onReady);
  });

  client.once(client.Event.SDK_READY_FROM_CACHE, function() {
    if (!key) splitSdk.dispatch(splitReadyFromCache());
  });

  // On SDK update, evaluate the registered `getTreatments` actions and dispatch `splitUpdate` action for the main client
  client.on(client.Event.SDK_UPDATE, function() {
    if (!key) splitSdk.dispatch(splitUpdate());
    Object.values(client.evalOnUpdate).forEach(function(params) {
      splitSdk.dispatch(__getTreatments(client, params));
    });
  });

  return client;
}

/**
 * This action creator destroy the Split SDK. It dispatches a Thunk (async) action.
 * Once the action is resolved, any subsequent dispatch of `getTreatments`
 * will update your treatments at the store with the `control` value.
 */
export function destroySplitSdk(): (dispatch: Dispatch<Action>) => Promise<void> {
  // Log error message if the SDK was not initiated with a `initSplitSdk` action
  if (!splitSdk.factory) {
    console.error(ERROR_DESTROY_NO_INITSPLITSDK);
    return () => Promise.resolve();
  }

  // Return Thunk (async) action
  return (dispatch: Dispatch<Action>): Promise<void> => {
    // same for node and browser (in node, `splitSdk.sharedClients` is an empty object)
    const mainClient = splitSdk.factory.client();
    const sharedClients = splitSdk.sharedClients;
    const destroyPromises = Object.keys(sharedClients).map((clientKey) => sharedClients[clientKey].destroy());
    destroyPromises.push(mainClient.destroy());
    return Promise.all(destroyPromises).then(function() {
      dispatch(splitDestroy());
    });

  };
}
