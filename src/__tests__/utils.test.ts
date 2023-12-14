/** Test targets */
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
    expect(validateGetTreatmentsParams({ splitNames: ['some split', null] })).toEqual({ splitNames: ['some split'] });
  });

  it('should return a sanitized copy of the provided params object', () => {
    expect(validateGetTreatmentsParams({ splitNames: 'some split' })).toEqual({ splitNames: ['some split'] });
  });

  it('should return an object with an empty splitNames array if the provided param is an empty object', () => {
    expect(validateGetTreatmentsParams({})).toEqual({ splitNames: [] });
  });

  it('should return an object with an empty splitNames array if the provided param is not an object', () => { // @ts-expect-error testing invalid input
    expect(validateGetTreatmentsParams()).toEqual({ splitNames: [] });
  });

  it('should return an object with an empty splitNames array if the provided param is not an object', () => {
    expect(validateGetTreatmentsParams('invalid')).toEqual({ splitNames: [] });
  });

});
