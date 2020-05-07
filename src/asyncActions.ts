import { SplitFactory } from '@splitsoftware/splitio';
import { Dispatch, Action } from 'redux';
import { ISplitSdk, IInitSplitSdkParams, IGetTreatmentsParams, ISplitFactoryBuilder, IClientNotDetached } from './types';
import { splitReady, splitTimedout, splitUpdate, splitDestroy, addTreatments } from './actions';
import { VERSION, ERROR_GETT_NO_INITSPLITSDK, ERROR_DESTROY_NO_INITSPLITSDK, getControlTreatmentsWithConfig } from './constants';
import { matching } from './utils';

/**
 * Internal object SplitSdk, shared by some library functions for their operation.
 * This object should not be accessed or modified by the user.
 */
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
export function initSplitSdk(params: IInitSplitSdkParams) {

  splitSdk.config = params.config;
  splitSdk.splitio = params.splitio || (SplitFactory as ISplitFactoryBuilder);

  // SDK factory and client initialization
  splitSdk.factory = splitSdk.splitio(splitSdk.config);
  splitSdk.isDetached = isDetached(splitSdk.factory);

  // Already checked if detached or not, so we'll proceed with overriding the language of the SDK for correct tracking. Don't try this at home.
  (splitSdk.factory.settings.version as any) = VERSION;

  // Return Thunk (asynk) action
  return (dispatch: Dispatch<Action>): Promise<void> => {
    // save the dispatch function, needed on browser to dispatch `getTreatment` actions on SDK_READY and SDK_UPDATE events
    // we do it before instantiating the client via `getClient`, to guarantee the reference of the dispatch function in `splitSdk`
    // @TODO possible refactor: no need to save the dispatch function if `getTreatments` return a thunk instead of a plain action
    splitSdk.dispatch = dispatch;

    const defaultClient = splitSdk.isDetached ? splitSdk.factory.client() : getClient(splitSdk);

    // Add callback listeners
    if (params.onReady) defaultClient.on(defaultClient.Event.SDK_READY, params.onReady);
    if (params.onTimedout) defaultClient.on(defaultClient.Event.SDK_READY_TIMED_OUT, params.onTimedout);
    if (params.onUpdate) defaultClient.on(defaultClient.Event.SDK_UPDATE, params.onUpdate);

    if (splitSdk.isDetached) {  // Split SDK running in Node

      // Dispatch actions for updating Split SDK status
      defaultClient.ready().then(() => {
        dispatch(splitReady());
      }, () => {
        dispatch(splitTimedout());
        defaultClient.once(defaultClient.Event.SDK_READY, () => {
          dispatch(splitReady());
        });
      });

    }

    // Return the promise so that the user can call .then() on async dispatch result and wait until ready.
    return defaultClient.ready();
  };
}

function __getSplitKeyString(key?: SplitIO.SplitKey): string {
  const splitKey = key || (splitSdk.config as SplitIO.IBrowserSettings).core.key;
  return matching(splitKey);
}

function __getItemKey(splitName: string, splitKeyString: string) {
  return splitName + '-' + splitKeyString;
}

function __addEvalOnUpdate(client: IClientNotDetached, params: IGetTreatmentsParams) {
  const splitKeyString = __getSplitKeyString(params.key);
  if (splitKeyString) {
    (params.splitNames as string[]).forEach((splitName) => {
      client.evalOnUpdate[__getItemKey(splitName, splitKeyString)] = { ...params, splitNames: [splitName] };
    });
  }
}

function __removeEvalOnUpdate(client: IClientNotDetached, params: IGetTreatmentsParams) {
  const splitKeyString = __getSplitKeyString(params.key);
  if (splitKeyString) {
    (params.splitNames as string[]).forEach((splitName) => {
      delete client.evalOnUpdate[__getItemKey(splitName, splitKeyString)];
    });
  }
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
export function getTreatments(params: IGetTreatmentsParams) {

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
      __addEvalOnUpdate(client, params);
    } else {
      __removeEvalOnUpdate(client, params);
    }

    // Execute the action if the SDK is ready, or store it for execution when ready and store a control treatment
    if (client.isReady) {
      return __getTreatments(client, params);
    } else {
      client.evalOnReady.push(params);
      // In this case we dispatch an addTreatments with control treatments, without calling the SDK (no impressions sent)
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
 * Used in not detached version (browser). It gets an SDK client and enhance it with additional properties:
 *  - `isReady` status property.
 *  - `evalOnUpdate` and `evalOnReady` action lists.
 *
 * @param splitSdk it contains the Split factory, the store dispatch function, and other internal properties
 * @param key optional user key
 * @returns SDK client with `isReady` and `isTimeout` status properties
 */
export function getClient(splitSdk: ISplitSdk, key?: SplitIO.SplitKey): IClientNotDetached {

  const stringKey = matching(key);
  const isMainClient = !stringKey || stringKey === matching((splitSdk.config as SplitIO.IBrowserSettings).core.key);
  // we cannot simply use `stringKey` to get the client, since the main one could have been created with a bucketing key and/or a traffic type.
  const client = (isMainClient ? splitSdk.factory.client() : splitSdk.factory.client(stringKey)) as IClientNotDetached;

  if (client._trackingStatus) return client;

  splitSdk.clients[stringKey] = client;
  client._trackingStatus = true;
  client.isReady = false;
  client.evalOnUpdate = {}; // getTreatment actions stored to execute on SDK update
  client.evalOnReady = []; // getTreatment actions stored to execute when the SDK is ready

  // we can use event listeners, since all clients are created via the `getClient` function:

  // On SDK ready, evaluate the registered `getTreatments` actions and dispatch `splitReady` action for the main client
  function onReady() {
    client.isReady = true;
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
 */
export function destroySplitSdk() {
  // Log error message if the SDK was not initiated with a `initSplitSdk` action
  if (!splitSdk.factory) {
    console.error(ERROR_DESTROY_NO_INITSPLITSDK);
    return () => { };
  }

  // Return Thunk (asynk) action
  return (dispatch: Dispatch<Action>): Promise<void> => {

    if (splitSdk.isDetached) {  // Split SDK running in Node
      return splitSdk.factory.client().destroy().then(function() {
        dispatch(splitDestroy());
      });
    } else {
      // @TODO update once JS SDK shutdown is updated to support destroy of shared clients
      const destroyPromises = Object.keys(splitSdk.clients).map((clientKey) => splitSdk.clients[clientKey].destroy());
      return Promise.all(destroyPromises).then(function() {
        dispatch(splitDestroy());
      });
    }

  };
}
