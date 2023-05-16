import { ISplitState } from './types';
import { CONTROL, CONTROL_WITH_CONFIG, DEFAULT_SPLIT_STATE_SLICE, ERROR_SELECTOR_NO_SPLITSTATE } from './constants';

export const getStateSlice = (sliceName: string) => (state: any) => state[sliceName];

export const defaultGetSplitState = getStateSlice(DEFAULT_SPLIT_STATE_SLICE);

/**
 * Selector function to extract a treatment evaluation from the Split state. It returns the treatment string value.
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
 * Selector function to extract a treatment evaluation from the Split state. It returns a treatment object containing its value and configuration.
 *
 * @param {ISplitState} splitState
 * @param {string} featureFlagName
 * @param {SplitIO.SplitKey} key
 * @param {TreatmentWithConfig} defaultValue
 */
export function selectTreatmentWithConfig(splitState: ISplitState, featureFlagName: string, key?: SplitIO.SplitKey, defaultValue: SplitIO.TreatmentWithConfig = CONTROL_WITH_CONFIG): SplitIO.TreatmentWithConfig {
  const splitTreatments = splitState && splitState.treatments ? splitState.treatments[featureFlagName] : console.error(ERROR_SELECTOR_NO_SPLITSTATE);
  const treatment =
    splitTreatments ?
      key ?
        splitTreatments[key.toString()] :
        Object.values(splitTreatments)[0] :
      undefined;

  return treatment ? treatment : defaultValue;
}
