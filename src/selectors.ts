import { ISplitState, IStatus } from './types';
import { CONTROL, CONTROL_WITH_CONFIG, DEFAULT_SPLIT_STATE_SLICE, ERROR_SELECTOR_NO_SPLITSTATE } from './constants';
import { isMainClient, matching } from './utils';
import { initialStatus } from './reducer';

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
  const splitTreatments = splitState && splitState.treatments ? splitState.treatments[featureFlagName] : console.error(ERROR_SELECTOR_NO_SPLITSTATE);
  const treatment =
    splitTreatments ?
      key ?
        splitTreatments[matching(key)] :
        Object.values(splitTreatments)[0] :
      undefined;

  return treatment ? treatment : defaultValue;
}

/**
 * This function extracts a treatment evaluation from the Split state. It returns an object that contains the treatment string value and the status properties of the client: `isReady`, `isReadyFromCache`, `hasTimedout`, and `isDestroyed`.
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
 * This function extracts a treatment evaluation from the Split state. It returns an object that contains the treatment object and the status properties of the client: `isReady`, `isReadyFromCache`, `hasTimedout`, and `isDestroyed`.
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

  const status = selectStatus(splitState, key);

  return {
    ...status,
    treatment,
  };
}

function selectStatus(splitState: ISplitState, key?: SplitIO.SplitKey): IStatus {
  const status = splitState ?
    isMainClient(key) ?
      splitState :
      splitState.status && splitState.status[matching(key)] :
    console.error(ERROR_SELECTOR_NO_SPLITSTATE);

  return status ?
    { isReady: status.isReady, isReadyFromCache: status.isReadyFromCache, isTimedout: status.isTimedout, hasTimedout: status.hasTimedout, isDestroyed: status.isDestroyed, lastUpdate: status.lastUpdate } :
    { ...initialStatus };
}
