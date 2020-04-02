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

export const getControlTreatmentsWithConfig = (splitNames: string[]): SplitIO.TreatmentsWithConfig => {
  return splitNames.reduce((pValue: SplitIO.TreatmentsWithConfig, cValue: string) => {
    pValue[cValue] = CONTROL_WITH_CONFIG;
    return pValue;
  }, {});
};

// Action types
export const SPLIT_READY: string = 'SPLIT_READY';

export const SPLIT_UPDATE: string = 'SPLIT_UPDATE';

export const SPLIT_TIMEDOUT: string = 'SPLIT_TIMEDOUT';

export const ADD_TREATMENTS: string = 'ADD_TREATMENTS';

// Warning and error messages
export const ERROR_GETT_NO_INITSPLITSDK: string = '[Error] To use "getTreatments" the SDK must be first initialized with a "initSplitSdk" action';

export const ERROR_TRACK_NO_INITSPLITSDK: string = '[Error] To use "track" the SDK must be first initialized with an "initSplitSdk" action';

export const ERROR_MANAGER_NO_INITSPLITSDK: string = '[Error] To use the manager, the SDK must be first initialized with an "initSplitSdk" action';

export const ERROR_SELECTOR_NO_SPLITSTATE: string = '[Error] When using selectors, "splitState" value must be a proper splitio piece of state';
