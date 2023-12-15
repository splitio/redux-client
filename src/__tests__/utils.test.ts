/** Test targets */
import { WARN_FEATUREFLAGS_AND_FLAGSETS } from '../constants';
import { matching, validateGetTreatmentsParams } from '../utils';

describe('matching', () => {

  it('if a string is passed as a param it should return a string', () => {
    const key = 'some key';
    const keyParsed = matching(key);

    expect(typeof keyParsed).toBe('string');
    expect(keyParsed).toBe(key);
  });

  it('if a number is passed as a param it should return a number', () => {
    const key = 1818;
    const keyParsed = matching(key as any);

    expect(typeof keyParsed).toBe('number');
    expect(keyParsed).toBe(key);
  });

  it('if a object is passed as a param it should return its `matchingKey` value', () => {
    const key = {
      matchingKey: 'some key',
      bucketingKey: 'another key',
    };
    const keyParsed = matching(key);

    expect(typeof keyParsed).toBe('string');
    expect(keyParsed).toBe(key.matchingKey);
  });

});

describe('validateGetTreatmentsParams', () => {

  it('should return a sanitized copy of the provided params object', () => {
    // String values are converted to arrays
    expect(validateGetTreatmentsParams({ splitNames: 'some split' })).toStrictEqual({ splitNames: ['some split'], flagSets: undefined });
    expect(validateGetTreatmentsParams({ flagSets: 'flag set' })).toStrictEqual({ splitNames: undefined, flagSets: ['flag set'] });

    // Feature flag names are sanitized because they are used by getControlTreatmentsWithConfig function while the SDK is not ready
    expect(validateGetTreatmentsParams({ splitNames: ['some split', null] })).toStrictEqual({ splitNames: ['some split'], flagSets: undefined });
    // Flag set names are not sanitized, because they are not used by Redux SDK directly
    expect(validateGetTreatmentsParams({ flagSets: ['flag set', null] })).toStrictEqual({ splitNames: undefined, flagSets: ['flag set', null] });
  });

  it('should ignore flagSets if both splitNames and flagSets are provided', () => {
    const consoleSpy = jest.spyOn(console, 'log');

    expect(validateGetTreatmentsParams({ splitNames: ['some split', null], flagSets: ['flag set', null] })).toStrictEqual({ splitNames: ['some split'], flagSets: undefined });
    expect(validateGetTreatmentsParams({ splitNames: true, flagSets: ['flag set', null] })).toStrictEqual({ splitNames: [], flagSets: undefined });

    expect(consoleSpy.mock.calls).toEqual([
      [WARN_FEATUREFLAGS_AND_FLAGSETS],
      ['[ERROR] you passed a null or undefined feature flag name, feature flag name must be a non-empty string.'],
      [WARN_FEATUREFLAGS_AND_FLAGSETS],
      ['[ERROR] feature flag names must be a non-empty array.']
    ]);
    consoleSpy.mockRestore();
  });

  it('should return a valid object if splitNames and flagSets values are invalid', () => {
    // Invalid values for splitNames and flagSets are converted to empty arrays
    expect(validateGetTreatmentsParams({ splitNames: {} })).toStrictEqual({ splitNames: [], flagSets: undefined });
    expect(validateGetTreatmentsParams({ flagSets: {} })).toStrictEqual({ splitNames: undefined, flagSets: [] });
    expect(validateGetTreatmentsParams({ splitNames: true })).toStrictEqual({ splitNames: [], flagSets: undefined });
    expect(validateGetTreatmentsParams({ flagSets: true })).toStrictEqual({ splitNames: undefined, flagSets: [] });
    expect(validateGetTreatmentsParams({ splitNames: null, flagSets: null })).toStrictEqual({ splitNames: undefined, flagSets: [] });
    expect(validateGetTreatmentsParams({})).toStrictEqual({ splitNames: undefined, flagSets: [] });
  });

  it('should return a valid object if the provided param is not an object', () => { // @ts-expect-error testing invalid input
    expect(validateGetTreatmentsParams()).toStrictEqual({ splitNames: undefined, flagSets: [] });
    expect(validateGetTreatmentsParams([])).toStrictEqual({ splitNames: undefined, flagSets: [] });
    expect(validateGetTreatmentsParams('invalid')).toStrictEqual({ splitNames: undefined, flagSets: [] });
  });

});
