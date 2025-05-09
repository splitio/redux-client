// @TODO Reuse IStatus and IClientStatus when interfaces are aligned (breaking change)
/** Type for Split client and manager status */
export interface IStatus {

  /**
   * isReady indicates if Split client is ready, i.e., if it has emitted an SDK_READY event.
   * @see {@link https://help.split.io/hc/en-us/articles/360020448791-JavaScript-SDK#subscribe-to-events}
   */
  isReady: boolean;

  /**
   * isReadyFromCache indicates if Split client has emitted an SDK_READY_FROM_CACHE event, what means that the SDK is ready to
   * evaluate using LocalStorage cached data (which might be stale).
   * This flag only applies for the Browser if using LOCALSTORAGE as storage type.
   * @see {@link https://help.split.io/hc/en-us/articles/360020448791-JavaScript-SDK#subscribe-to-events}
   */
  isReadyFromCache: boolean;

  /**
   * isTimedout indicates if the Split client has emitted an SDK_READY_TIMED_OUT event and is not ready.
   * In other words, `isTimedout` is equivalent to `hasTimeout && !isReady`.
   * @see {@link https://help.split.io/hc/en-us/articles/360020448791-JavaScript-SDK#subscribe-to-events}
   */
  isTimedout: boolean;

  /**
   * hasTimedout indicates if the Split client has ever emitted an SDK_READY_TIMED_OUT event.
   * It's meant to keep a reference that the SDK emitted a timeout at some point, not the current state.
   * @see {@link https://help.split.io/hc/en-us/articles/360020448791-JavaScript-SDK#subscribe-to-events}
   */
  hasTimedout: boolean;

  /**
   * isDestroyed indicates if the Split client has been destroyed by dispatching a `destroySplitSdk` action.
   * @see {@link https://help.split.io/hc/en-us/articles/360038851551-Redux-SDK#shutdown}
   */
  isDestroyed: boolean;

  /**
   * lastUpdate is the timestamp of the last Split client event (SDK_READY, SDK_READY_TIMED_OUT or SDK_UPDATE).
   * @see {@link https://help.split.io/hc/en-us/articles/360038851551-Redux-SDK#subscribe-to-events}
   */
  lastUpdate: number;
}

/** Type for Split reducer's slice of state */
export interface ISplitState extends IStatus {
  /**
   * `treatments` is a nested object property that contains the evaluations of feature flags.
   * Each evaluation (treatment) is associated with a feature flag name and a key (e.g., unique user identifier, such as a user id).
   * Thus the property has 3 levels: feature flag name, key, and finally the treatment that was evaluated for that specific feature flag and key.
   */
  treatments: {
    [featureFlagName: string]: {
      [key: string]: SplitIO.TreatmentWithConfig;
    };
  };
  /**
   * `status` is a nested object property that contains the readiness status of the non-default clients.
   */
  status?: {
    [key: string]: IStatus;
  };
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
   * Optional param to provide a Split factory initializer to use instead of SplitFactory from `'@splitsoftware/splitio'`.
   * It can be useful when the Split factory is imported from the UMD bundle in a HTML script.
   */
  splitio?: ISplitFactoryBuilder;

  /**
   * optional callback to be invoked on SDK_READY event
   */
  onReady?: () => any;

  /**
   * optional callback to be invoked on SDK_READY_FROM_CACHE event
   */
  onReadyFromCache?: () => any;

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
export type IGetTreatmentsParams = {

  /**
   * user key used to evaluate. It is mandatory for Node.js but optional for browser. If not provided in browser,
   * it defaults to the key defined in the SDK config, i.e., the config object passed to `initSplitSdk`.
   */
  key?: SplitIO.SplitKey;

  /**
   * optional map of attributes passed to the actual `client.getTreatment*` methods.
   * @see {@link https://help.split.io/hc/en-us/articles/360038851551-Redux-SDK#attribute-syntax}
   */
  attributes?: SplitIO.Attributes;

  /**
   * Optional properties to append to the generated impression object sent to Split backend.
   */
  properties?: SplitIO.Properties;

  /**
   * This param indicates to re-evaluate the feature flags if the SDK is updated. For example, a `true` value might be
   * the desired behavior for permission toggles or operation toggles, such as a kill switch, that you want to
   * immediately reflect in your app. A `false` value might be useful for experiment or release toggles, where
   * you want to keep the treatment unchanged during the session of the user.
   *
   * @defaultValue `false`
   */
  evalOnUpdate?: boolean;

  /**
   * This param indicates to evaluate the feature flags if the SDK is ready from cache (i.e., it emits SDK_READY_FROM_CACHE event).
   * This params is only relevant when using 'LOCALSTORAGE' as storage type, since otherwise the event is never emitted.
   *
   * @defaultValue `false`
   */
  evalOnReadyFromCache?: boolean;
} & ({

  /**
   * Feature flag name or array of feature flag names to evaluate. Either this or the `flagSets` property must be provided. If both are provided, the `flagSets` option is ignored.
   */
  splitNames: string[] | string;
  flagSets?: undefined;
} | {

  /**
   * Feature flag set or array of feature flag sets to evaluate. Either this or the `splitNames` property must be provided. If both are provided, the `flagSets` option is ignored.
   */
  flagSets: string[] | string;
  splitNames?: undefined;
})

/**
 * Type of the param object passed to `destroySplitSdk` action creator.
 */
export interface IDestroySplitSdkParams {
  /**
   * optional callback to be invoked once the SDK has gracefully shut down
   */
  onDestroy?: () => any;
}

/**
 * Type of the param object passed to `track` function helper.
 */
export interface ITrackParams {

  /**
   * user key used to track event. It is mandatory for Node.js but optional for browser. If not provided in browser,
   * it defaults to the key defined in the SDK config object.
   */
  key?: SplitIO.SplitKey;

  /**
   * the traffic type of the key in the track call. If not provided, the function logs an error message and returns false.
   */
  trafficType: string;

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

export type ISplitFactoryBuilder = ((settings: SplitIO.IBrowserSettings) => SplitIO.IBrowserSDK) | ((settings: SplitIO.INodeSettings) => SplitIO.ISDK);

export type ISplitAction = {
  type: string;
  payload: {
    timestamp?: number;
    key?: string;
    treatments?: SplitIO.TreatmentsWithConfig;
    nonDefaultKey?: boolean;
  };
}
