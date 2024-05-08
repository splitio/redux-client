import { ISplitState, ISplitStatus } from './types';
import { CONTROL, CONTROL_WITH_CONFIG, DEFAULT_SPLIT_STATE_SLICE, ERROR_SELECTOR_NO_SPLITSTATE } from './constants';
import { getClient } from './asyncActions';
import { splitSdk } from './asyncActions';
import { getStatus, matching } from './utils';

export const getStateSlice = (sliceName: string) => (state: any) => state[sliceName];

export const defaultGetSplitState = getStateSlice(DEFAULT_SPLIT_STATE_SLICE);

/**
 * Selector function to extract a treatment evaluation from the Split state. It returns the treatment string value.
 *
 * @param {ISplitState} splitState
 * @param {string} featureFlagName
 * @param {SplitIO.SplitKey} key
 * @param {string} defaultValue
 *
 * @deprecated Use selectSplitTreatment instead
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
 *
 * @deprecated Use selectSplitTreatmentWithConfig instead
 */
export function selectTreatmentWithConfig(splitState: ISplitState, featureFlagName: string, key?: SplitIO.SplitKey, defaultValue: SplitIO.TreatmentWithConfig = CONTROL_WITH_CONFIG): SplitIO.TreatmentWithConfig {
  // @TODO reuse `selectSplitTreatmentWithConfig`
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
 * Selector function to extract a treatment evaluation from the Split state. It returns the treatment string value.
 *
 * @param {ISplitState} splitState
 * @param {string} featureFlagName
 * @param {SplitIO.SplitKey} key
 * @param {string} defaultValue
 */
export function selectSplitTreatment(splitState: ISplitState, featureFlagName: string, key?: SplitIO.SplitKey, defaultValue: string = CONTROL): {
  treatment: string
} & ISplitStatus {
  const result: any = selectSplitTreatmentWithConfig(splitState, featureFlagName, key, { treatment: defaultValue, config: null });
  result.treatment = result.treatment.treatment;
  return result;
}

/**
 * Selector function to extract a treatment evaluation from the Split state. It returns a treatment object containing its value and configuration.
 *
 * @param {ISplitState} splitState
 * @param {string} featureFlagName
 * @param {SplitIO.SplitKey} key
 * @param {TreatmentWithConfig} defaultValue
 */
export function selectSplitTreatmentWithConfig(splitState: ISplitState, featureFlagName: string, key?: SplitIO.SplitKey, defaultValue: SplitIO.TreatmentWithConfig = CONTROL_WITH_CONFIG): {
  treatment?: SplitIO.TreatmentWithConfig
} & ISplitStatus {
  const client = getClient(splitSdk, key, true);

  // @TODO what should return for user error (wrong key or initSplitSdk action not dispatched yet)
  if (!client) return {
    treatment: undefined,
    isReady: false,
    isReadyFromCache: false,
    hasTimedout: false,
    isDestroyed: false,
    isTimedout: false,
    lastUpdate: 0
  };

  const splitTreatments = splitState && splitState.treatments ? splitState.treatments[featureFlagName] : console.error(ERROR_SELECTOR_NO_SPLITSTATE);
  const treatment =
    splitTreatments ?
      key ?
        splitTreatments[matching(key)] :
        Object.values(splitTreatments)[0] :
      undefined;

  const status = getStatus(client);

  return {
    ...status,
    treatment: treatment ? treatment : defaultValue,
    isTimedout: status.hasTimedout && !status.isReady,
    lastUpdate: splitState.lastUpdate
  };
}
