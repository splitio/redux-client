/** Test targets */
import { matching } from '../utils';

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
