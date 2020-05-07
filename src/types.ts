/** Type for Split reducer's slice of state */
export interface ISplitState {

  /**
   * isReady indicates if Split SDK is ready, i.e., if it has triggered a SDK_READY event.
   * @see {@link https://help.split.io/hc/en-us/articles/360038851551-Redux-SDK#advanced-subscribe-to-events-and-changes}
   */
  isReady: boolean;

  /**
   * isTimedout indicates if the Split SDK has triggered a SDK_READY_TIMED_OUT event and is not ready.
   * @see {@link https://help.split.io/hc/en-us/articles/360038851551-Redux-SDK#advanced-subscribe-to-events-and-changes}
   */
  isTimedout: boolean;

  /**
   * hasTimedout indicates if the Split SDK has triggered a SDK_READY_TIMED_OUT event.
   * It differs from `isTimedout` in that it doesn't change when SDK turns ready.
   * @see {@link https://help.split.io/hc/en-us/articles/360038851551-Redux-SDK#advanced-subscribe-to-events-and-changes}
   */
  hasTimedout: boolean;

  /**
   * isDestroyed indicates if the Split SDK has been destroyed by dispatching a `destroySplitSdk` action.
   * @see {@link https://help.split.io/hc/en-us/articles/360038851551-Redux-SDK#shutdown}
   */
  isDestroyed: boolean;

  /**
   * lastUpdate is the timestamp of the last Split SDK event (SDK_READY, SDK_READY_TIMED_OUT or SDK_UPDATE).
   * @see {@link https://help.split.io/hc/en-us/articles/360038851551-Redux-SDK#advanced-subscribe-to-events-and-changes}
   */
  lastUpdate: number;

  /**
   * This property contains the evaluations of Splits.
   * Each evaluation is associated with an Split name and a key (e.g., user id or organization name).
   * Thus the property has 3 levels: split name, user key, and finally the treatment that was evaluated for that split and key.
   */
  treatments: ISplitTreatments;
}

/**
 * First level of the `treatments` property.
 * It consists of the list of evaluated splits.
 */
export interface ISplitTreatments {
  [splitName: string]: IKeyTreatments;
}

/**
 * Second level of the `treatments` property.
 * It consists of the list of evaluated keys for the container split.
 */
export interface IKeyTreatments {
  [key: string]: SplitIO.TreatmentWithConfig;
}

export type IGetSplitState = (state: any) => ISplitState;

/**
 * Type of the param object passed to `initSplitSdk` action creator.
 */
export interface IInitSplitSdkParams {

  /**
   * Setting object used to initialize the Split factory.
   * @see {@link https://help.split.io/hc/en-us/articles/360038851551-Redux-SDK#configuration}
   */
  config: SplitIO.IBrowserSettings | SplitIO.INodeSettings;

  /**
   * Optional param to provide a Split factory initializer to use instead of SplitFactory from '@splitsoftware/splitio'.
   * It can be useful when the Split factory is imported from the UMD bundle in a HTML script.
   */
  splitio?: ISplitFactoryBuilder;

  /**
   * optional callback to be invoked on SDK_READY event
   */
  onReady?: () => any;

  /**
   * optional callback to be invoked on SDK_READY_TIMED_OUT event
   */
  onTimedout?: () => any;

  /**
   * optional callback to be invoked on SDK_UPDATE event
   */
  onUpdate?: () => any;
}

/**
 * Type of the param object passed to `getTreatments` action creator.
 */
export interface IGetTreatmentsParams {

  /**
   * user key used to evaluate. It is mandatory for node but optional for browser. If not provided in browser,
   * it defaults to the key defined in the SDK config, i.e., the config object passed to `initSplitSdk`.
   */
  key?: SplitIO.SplitKey;

  /**
   * split name or array of split names to evaluate.
   */
  splitNames: string[] | string;

  /**
   * optional map of attributes passed to the actual `client.getTreatment*` methods.
   * @see {@link https://help.split.io/hc/en-us/articles/360038851551-Redux-SDK#attribute-syntax}
   */
  attributes?: SplitIO.Attributes;

  /**
   * This param indicates to re-evaluate the splits if the SDK is updated. For example, a `true` value might be
   * the desired behaviour for permission toggles or operation toggles, such as a kill switch, that you want to
   * inmediately reflect in your app. A `false` value might be useful for experiment or release toggles, where
   * you want to keep the treatment unchanged during the sesion of the user.
   * The param is `false` by default.
   */
  evalOnUpdate?: boolean;
}

/**
 * Type of the param object passed to `track` function helper.
 */
export interface ITrackParams {

  /**
   * user key used to track event. It is mandatory for node but optional for browser. If not provided in browser,
   * it defaults to the key defined in the SDK config object.
   */
  key?: SplitIO.SplitKey;

  /**
   * the traffic type of the key in the track call. If not provided, it defaults to the traffic type defined in the SDK
   * config object. If not provided either in the SDK setting, the function logs an error message and returns false.
   */
  trafficType?: string;

  /**
   * The event type that this event should correspond to. The expected data type is String.
   */
  eventType: string;

  /**
   * Optional value to be used in creating the metric.
   */
  value?: number;

  /**
   * Optional object of key-value pairs that can be used to filter your metrics.
   */
  properties?: SplitIO.Properties;
}

export type ISplitFactoryBuilder = (settings: SplitIO.IBrowserSettings | SplitIO.INodeSettings) => SplitIO.ISDK;

import { Dispatch, Action } from 'redux';

/**
 * Type of internal object SplitSdk.
 * This object should not be accessed or modified by the user. It is used by the library for its operation.
 */
export interface ISplitSdk {
  config: SplitIO.IBrowserSettings | SplitIO.INodeSettings;
  splitio: ISplitFactoryBuilder;
  factory: SplitIO.ISDK;
  sharedClients: { [stringKey: string]: SplitIO.IClient };
  isDetached: boolean;
  dispatch: Dispatch<Action>;
}

/**
 * Interface of SDK client for not detached execution (browser).
 */
export interface IClientNotDetached extends SplitIO.IClient {
  _trackingStatus?: boolean;
  isReady: boolean;
  evalOnUpdate: { [splitNameSplitKeyPair: string]: IGetTreatmentsParams }; // redoOnUpdateOrReady
  evalOnReady: IGetTreatmentsParams[]; // waitUntilReady
}
