import { SplitFactory } from '@splitsoftware/splitio';
import { Dispatch, Action } from 'redux';
import { ISplitSdk, IInitSplitSdkParams, IGetTreatmentsParams, ISplitFactoryBuilder } from './types';
import { splitReady, splitTimedout, splitUpdate, addTreatments } from './actions';
import { VERSION, ERROR_GETT_NO_INITSPLITSDK, getControlTreatmentsWithConfig } from './constants';
import { matching } from './utils';

/**
 * Internal object SplitSdk, shared by some library functions for their operation.
 * This object should not be accessed or modified by the user.
 */
export const splitSdk: ISplitSdk = {
  config: null,
  splitio: null,
  factory: null,
  evalOnUpdate: {}, // getTreatment actions stored to execute on SDK update
  evalOnReady: [], // getTreatment actions stored to execute when the SDK is ready
  isReady: false,
  isDettached: false,
};

function isDettached(factory: SplitIO.ISDK) {
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
  const defaultClient = splitSdk.factory.client();
  splitSdk.isDettached = isDettached(splitSdk.factory);

  // Already checked if dettached or not, so we'll proceed with overriding the language of the SDK for correct tracking. Don't try this at home.
  (splitSdk.factory.settings.version as any) = VERSION;

  // Add callback listeners
  if (params.onReady) { defaultClient.on(defaultClient.Event.SDK_READY, params.onReady); }
  if (params.onTimedout) { defaultClient.on(defaultClient.Event.SDK_READY_TIMED_OUT, params.onTimedout); }
  if (params.onUpdate) { defaultClient.on(defaultClient.Event.SDK_UPDATE, params.onUpdate); }

  // Return Thunk (asynk) action
  return (dispatch: Dispatch<Action>): Promise<void> => {

    if (!splitSdk.isDettached) { // Split SDK running in Browser

      // On SDK update, dispatch `splitUpdate` and evaluate the registered `getTreatments` actions
      defaultClient.on(defaultClient.Event.SDK_UPDATE, () => {
        dispatch(splitUpdate());
        Object.values(splitSdk.evalOnUpdate).forEach((params) =>
          dispatch(__getTreatments(params)),
        );
      });

      // On SDK ready, dispatch `splitReady` action and evaluate the registered `getTreatments` actions
      defaultClient.once(defaultClient.Event.SDK_READY, () => {
        splitSdk.isReady = true;
        dispatch(splitReady());
        splitSdk.evalOnReady.forEach((params) =>
          dispatch(__getTreatments(params)),
        );
      });

      // On SDK timed out, dispatch `splitTimedout` action
      defaultClient.once(defaultClient.Event.SDK_READY_TIMED_OUT, () => {
        dispatch(splitTimedout());
      });

    } else {  // Split SDK running in Node

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

function __getSplitKeyString(key?: SplitIO.SplitKey) {
  const splitKey = key || (splitSdk.config as SplitIO.IBrowserSettings).core.key;
  return matching(splitKey);
}

function __getItemKey(splitName: string, splitKeyString: string) {
  return splitName + '-' + splitKeyString;
}

function __addEvalOnUpdate(params: IGetTreatmentsParams) {
  const splitKeyString = __getSplitKeyString(params.key);
  if (splitKeyString) {
    (params.splitNames as string[]).forEach((splitName) => {
      splitSdk.evalOnUpdate[__getItemKey(splitName, splitKeyString)] = { ...params, splitNames: [splitName] };
    });
  }
}

function __removeEvalOnUpdate(params: IGetTreatmentsParams) {
  const splitKeyString = __getSplitKeyString(params.key);
  if (splitKeyString) {
    (params.splitNames as string[]).forEach((splitName) => {
      delete splitSdk.evalOnUpdate[__getItemKey(splitName, splitKeyString)];
    });
  }
}

// This function is only exposed for unit testing purposses.
export function __getTreatments(params: IGetTreatmentsParams) {
  const client = (!params.key || params.key === (splitSdk.config as SplitIO.IBrowserSettings).core.key) ? splitSdk.factory.client() : splitSdk.factory.client(params.key);
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

  if (!splitSdk.isDettached) { // Split SDK running in Browser

    // Register or unregister the current `getTreatments` action from being re-executed on SDK_UPDATE.
    if (params.evalOnUpdate) {
      __addEvalOnUpdate(params);
    } else {
      __removeEvalOnUpdate(params);
    }

    // Execute the action if the SDK is ready, or store it for execution when ready and store a control treatment
    if (splitSdk.isReady) {
      return __getTreatments(params);
    } else {
      splitSdk.evalOnReady.push(params);
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
