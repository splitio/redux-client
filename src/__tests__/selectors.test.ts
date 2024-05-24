/** Mocks */
import { SPLIT_1, SPLIT_2, SPLIT_INVALID, STATE_READY, USER_1, USER_INVALID } from './utils/storeState';

/** Constants */
import { ON, OFF, CONTROL, CONTROL_WITH_CONFIG, ERROR_SELECTOR_NO_SPLITSTATE } from '../constants';
import { ISplitState } from '../types';

/** Test targets */
import {
  selectTreatmentValue,
  selectTreatmentWithConfig,
} from '../selectors';

describe('selectTreatmentValue', () => {
  it('returns the first treatment value if the key is not provided', () => {
    /** The treatment value for the first key for SPLIT_1 is 'on' */
    expect(selectTreatmentValue(STATE_READY.splitio, SPLIT_1)).toBe(ON);
  });

  it('returns the treatment value of the given feature flag name and key', () => {
    /** The treatment value for the USER_1 key for SPLIT_1 is 'off' */
    expect(selectTreatmentValue(STATE_READY.splitio, SPLIT_2, USER_1)).toBe(OFF);
    // Using a key object
    expect(selectTreatmentValue(STATE_READY.splitio, SPLIT_2, { matchingKey: USER_1, bucketingKey: 'some_bucket' })).toBe(OFF); // @ts-expect-error bucketingKey is not in SplitKey type, but it's not used in the selector
    expect(selectTreatmentValue(STATE_READY.splitio, SPLIT_2, { matchingKey: USER_1 })).toBe(OFF);
  });

  it('returns "control" value and logs error if the given feature flag name or key are invalid (were not evaluated with getTreatment action)', () => {
    const logSpy = jest.spyOn(console, 'log');
    expect(selectTreatmentValue(STATE_READY.splitio, SPLIT_1, USER_INVALID)).toBe(CONTROL);
    expect(logSpy).toHaveBeenLastCalledWith(`[WARN] Treatment not found by selector. Check you have dispatched a "getTreatments" action for the feature flag "${SPLIT_1}" and key "${USER_INVALID}"`);
    expect(selectTreatmentValue(STATE_READY.splitio, SPLIT_INVALID, USER_1)).toBe(CONTROL);
    expect(logSpy).toHaveBeenLastCalledWith(`[WARN] Treatment not found by selector. Check you have dispatched a "getTreatments" action for the feature flag "${SPLIT_INVALID}" and key "${USER_1}"`);
  });

  it('returns the passed default treatment value and logs error if the given feature flag name or key are invalid', () => {
    const logSpy = jest.spyOn(console, 'log');
    expect(selectTreatmentValue(STATE_READY.splitio, SPLIT_1, USER_INVALID, 'some_value')).toBe('some_value');
    expect(logSpy).toHaveBeenLastCalledWith(`[WARN] Treatment not found by selector. Check you have dispatched a "getTreatments" action for the feature flag "${SPLIT_1}" and key "${USER_INVALID}"`);
    expect(selectTreatmentValue(STATE_READY.splitio, SPLIT_INVALID, USER_1, 'some_value')).toBe('some_value');
    expect(logSpy).toHaveBeenLastCalledWith(`[WARN] Treatment not found by selector. Check you have dispatched a "getTreatments" action for the feature flag "${SPLIT_INVALID}" and key "${USER_1}"`);
  });

  it('returns "control" and logs error if the given splitState is invalid', () => {
    const errorSpy = jest.spyOn(console, 'error');
    expect(selectTreatmentValue((STATE_READY as unknown as ISplitState), SPLIT_1, USER_INVALID)).toBe(CONTROL);
    expect(errorSpy).toBeCalledWith(ERROR_SELECTOR_NO_SPLITSTATE);
  });
});

describe('selectTreatmentWithConfig', () => {
  it('returns the first treatment if the key is not provided', () => {
    expect(selectTreatmentWithConfig(STATE_READY.splitio, SPLIT_1)).toBe(STATE_READY.splitio.treatments[SPLIT_1][USER_1]);
  });

  it('returns the treatment of the given feature flag name and key', () => {
    expect(selectTreatmentWithConfig(STATE_READY.splitio, SPLIT_2, USER_1)).toBe(STATE_READY.splitio.treatments[SPLIT_2][USER_1]);
    // Using a key object
    expect(selectTreatmentWithConfig(STATE_READY.splitio, SPLIT_2, { matchingKey: USER_1, bucketingKey: 'some_bucket' })).toBe(STATE_READY.splitio.treatments[SPLIT_2][USER_1]);
  });

  it('returns "control" treatment if the given feature flag name or key are invalid (were not evaluated with getTreatment, or returned "control")', () => {
    expect(selectTreatmentWithConfig(STATE_READY.splitio, SPLIT_1, USER_INVALID)).toBe(CONTROL_WITH_CONFIG);
    expect(selectTreatmentWithConfig(STATE_READY.splitio, SPLIT_INVALID, USER_1)).toBe(CONTROL_WITH_CONFIG);
  });

  it('returns the passed default treatment instead of "control" if the given feature flag name or key are invalid', () => {
    const DEFAULT_TREATMENT = { treatment: 'some_value', config: 'some_config' };

    expect(selectTreatmentWithConfig(STATE_READY.splitio, SPLIT_1, USER_INVALID, DEFAULT_TREATMENT)).toBe(DEFAULT_TREATMENT);
    expect(selectTreatmentWithConfig(STATE_READY.splitio, SPLIT_INVALID, USER_1, DEFAULT_TREATMENT)).toBe(DEFAULT_TREATMENT);
  });

  it('returns "control" and logs error if the given splitState is invalid', () => {
    const errorSpy = jest.spyOn(console, 'error');
    expect(selectTreatmentWithConfig((STATE_READY as unknown as ISplitState), SPLIT_1, USER_INVALID)).toBe(CONTROL_WITH_CONFIG);
    expect(errorSpy).toBeCalledWith(ERROR_SELECTOR_NO_SPLITSTATE);
  });
});
