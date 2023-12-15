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

    expect(validateGetTreatmentsParams({ splitNames: ['some split'], flagSets: ['flag set', null] })).toStrictEqual({ splitNames: ['some split'], flagSets: undefined });

    expect(consoleSpy.mock.calls).toEqual([[WARN_FEATUREFLAGS_AND_FLAGSETS]]);
    consoleSpy.mockRestore();
  });

  it('should return false if splitNames and flagSets values are invalid', () => {
    // Invalid values for splitNames and flagSets are converted to empty arrays
    expect(validateGetTreatmentsParams({ splitNames: {} })).toStrictEqual(false);
    expect(validateGetTreatmentsParams({ flagSets: {} })).toStrictEqual(false);
    expect(validateGetTreatmentsParams({ splitNames: true })).toStrictEqual(false);
    expect(validateGetTreatmentsParams({ flagSets: true })).toStrictEqual(false);
    expect(validateGetTreatmentsParams({ splitNames: null, flagSets: null })).toStrictEqual(false);
    expect(validateGetTreatmentsParams({})).toStrictEqual(false);
  });

  it('should return false if the provided param is not an object', () => { // @ts-expect-error testing invalid input
    expect(validateGetTreatmentsParams()).toStrictEqual(false);
    expect(validateGetTreatmentsParams([])).toStrictEqual(false);
    expect(validateGetTreatmentsParams('invalid')).toStrictEqual(false);
  });

});
