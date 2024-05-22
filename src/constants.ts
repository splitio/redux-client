// Default value for the key where the Split piece of state is expected to be mounted.
export const DEFAULT_SPLIT_STATE_SLICE = 'splitio';

export const VERSION = 'redux-' + 'REDUX_SDK_VERSION_NUMBER';

// Treatments
export const ON: SplitIO.Treatment = 'on';

export const OFF: SplitIO.Treatment = 'off';

export const CONTROL: SplitIO.Treatment = 'control'; // SplitIO's default value

export const CONTROL_WITH_CONFIG: SplitIO.TreatmentWithConfig = {
  treatment: 'control', // SplitIO's default value
  config: null,
};

export const getControlTreatmentsWithConfig = (featureFlagNames: string[]): SplitIO.TreatmentsWithConfig => {
  return featureFlagNames.reduce((pValue: SplitIO.TreatmentsWithConfig, cValue: string) => {
    pValue[cValue] = CONTROL_WITH_CONFIG;
    return pValue;
  }, {});
};

// Action types
export const SPLIT_READY = 'SPLIT_READY';

export const SPLIT_READY_WITH_EVALUATIONS = 'SPLIT_READY_WITH_EVALUATIONS';

export const SPLIT_READY_FROM_CACHE = 'SPLIT_READY_FROM_CACHE';

export const SPLIT_READY_FROM_CACHE_WITH_EVALUATIONS = 'SPLIT_READY_FROM_CACHE_WITH_EVALUATIONS';

export const SPLIT_UPDATE = 'SPLIT_UPDATE';

export const SPLIT_UPDATE_WITH_EVALUATIONS = 'SPLIT_UPDATE_WITH_EVALUATIONS';

export const SPLIT_TIMEDOUT = 'SPLIT_TIMEDOUT';

export const SPLIT_DESTROY = 'SPLIT_DESTROY';

export const ADD_TREATMENTS = 'ADD_TREATMENTS';

// Warning and error messages
export const ERROR_GETT_NO_INITSPLITSDK = '[ERROR] To use "getTreatments" the SDK must be first initialized with an "initSplitSdk" action';

export const ERROR_DESTROY_NO_INITSPLITSDK = '[ERROR] To use "destroySplitSdk" the SDK must be first initialized with an "initSplitSdk" action';

export const ERROR_TRACK_NO_INITSPLITSDK = '[ERROR] To use "track" the SDK must be first initialized with an "initSplitSdk" action';

export const ERROR_MANAGER_NO_INITSPLITSDK = '[ERROR] To use the manager, the SDK must be first initialized with an "initSplitSdk" action';

export const ERROR_SELECTOR_NO_INITSPLITSDK = '[ERROR] To use selectors, the SDK must be first initialized with an "initSplitSdk" action';

export const ERROR_SELECTOR_NO_SPLITSTATE = '[ERROR] To use selectors, "splitState" param must be a proper splitio piece of state';

export const ERROR_GETT_NO_PARAM_OBJECT = '[ERROR] "getTreatments" must be called with a param object containing a valid splitNames or flagSets properties';

export const WARN_FEATUREFLAGS_AND_FLAGSETS = '[WARN]  Both splitNames and flagSets properties were provided. flagSets will be ignored';
