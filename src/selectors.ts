import { ISplitState, IStatus } from './types';
import { CONTROL, CONTROL_WITH_CONFIG, DEFAULT_SPLIT_STATE_SLICE, ERROR_SELECTOR_NO_SPLITSTATE } from './constants';
import { matching } from './utils';
import { getStatus } from './helpers';

export const getStateSlice = (sliceName: string) => (state: any) => state[sliceName];

export const defaultGetSplitState = getStateSlice(DEFAULT_SPLIT_STATE_SLICE);

/**
 * This function extracts a treatment evaluation from the Split state. It returns the treatment string value.
 * If a treatment is not found, it returns the default value, which is `'control'` if not specified.
 * A treatment is not found if an invalid Split state is passed or if a `getTreatments` action has not been dispatched for the provided feature flag name and key.
 *
 * @param {ISplitState} splitState
 * @param {string} featureFlagName
 * @param {SplitIO.SplitKey} key
 * @param {string} defaultValue
 */
export function selectTreatmentValue(splitState: ISplitState, featureFlagName: string, key?: SplitIO.SplitKey, defaultValue: string = CONTROL): string {
  return selectTreatmentWithConfig(splitState, featureFlagName, key, { treatment: defaultValue, config: null }).treatment;
}

/**
 * This function extracts a treatment evaluation from the Split state. It returns a treatment object containing its value and configuration.
 * If a treatment is not found, it returns the default value, which is `{ treatment: 'control', configuration: null }` if not specified.
 * A treatment is not found if an invalid Split state is passed or if a `getTreatments` action has not been dispatched for the provided feature flag name and key.
 *
 * @param {ISplitState} splitState
 * @param {string} featureFlagName
 * @param {SplitIO.SplitKey} key
 * @param {SplitIO.TreatmentWithConfig} defaultValue
 */
export function selectTreatmentWithConfig(splitState: ISplitState, featureFlagName: string, key?: SplitIO.SplitKey, defaultValue: SplitIO.TreatmentWithConfig = CONTROL_WITH_CONFIG): SplitIO.TreatmentWithConfig {
  if (!splitState || !splitState.treatments) {
    console.error(ERROR_SELECTOR_NO_SPLITSTATE);
    return defaultValue;
  }

  const splitTreatments = splitState.treatments[featureFlagName];

  const treatment = splitTreatments ?
    key ?
      splitTreatments[matching(key)] :
      Object.values(splitTreatments)[0] :
    undefined;

  if (!treatment) {
    console.log(`[WARN] Treatment not found by selector. Check you have dispatched a "getTreatments" action for the feature flag "${featureFlagName}" ${key ? `and key "${matching(key)}"` : ''}`);
    return defaultValue;
  }

  return treatment;
}

/**
 * This function extracts a treatment evaluation from the Split state. It returns an object that contains the treatment string value and the status properties of the client: `isReady`, `isReadyFromCache`, `isTimedout`, `hasTimedout`, `isDestroyed`, and `lastUpdate`.
 * If a treatment is not found, it returns the default value, which is `'control'` if not specified.
 * A treatment is not found if an invalid Split state is passed or if a `getTreatments` action has not been dispatched for the provided feature flag name and key.
 *
 * @param {ISplitState} splitState
 * @param {string} featureFlagName
 * @param {SplitIO.SplitKey} key
 * @param {string} defaultValue
 */
export function selectTreatmentAndStatus(splitState: ISplitState, featureFlagName: string, key?: SplitIO.SplitKey, defaultValue: string = CONTROL): {
  treatment: string
} & IStatus {
  const result: any = selectTreatmentWithConfigAndStatus(splitState, featureFlagName, key, { treatment: defaultValue, config: null });
  result.treatment = result.treatment.treatment;
  return result;
}

/**
 * This function extracts a treatment evaluation from the Split state. It returns an object that contains the treatment object and the status properties of the client: `isReady`, `isReadyFromCache`, `isTimedout`, `hasTimedout`, `isDestroyed`, and `lastUpdate`.
 * If a treatment is not found, it returns the default value as treatment, which is `{ treatment: 'control', configuration: null }` if not specified.
 * A treatment is not found if an invalid Split state is passed or if a `getTreatments` action has not been dispatched for the provided feature flag name and key.
 *
 * @param {ISplitState} splitState
 * @param {string} featureFlagName
 * @param {SplitIO.SplitKey} key
 * @param {SplitIO.TreatmentWithConfig} defaultValue
 */
export function selectTreatmentWithConfigAndStatus(splitState: ISplitState, featureFlagName: string, key?: SplitIO.SplitKey, defaultValue: SplitIO.TreatmentWithConfig = CONTROL_WITH_CONFIG): {
  treatment: SplitIO.TreatmentWithConfig
} & IStatus {
  const treatment = selectTreatmentWithConfig(splitState, featureFlagName, key, defaultValue);

  const status = getStatus(key);

  return {
    ...status,
    treatment,
  };
}
