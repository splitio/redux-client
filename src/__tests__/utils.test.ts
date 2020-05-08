/** Test targets */
import { matching, promiseWrapper } from '../utils';

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

describe('promiseWrapper', () => {

  it('wraps a given promise with a functions that handles promise rejection if not other onRejected handler is provided', (done) => {

    const value = 'value';
    const failHandler = () => { expect(true).toBe(false); };
    const passHandler = (val: any) => { expect(val).toBe(value); return val; };
    const passHandlerWithThrow = (val: any) => { expect(val).toBe(value); throw val; };
    const createResolvedPromise = () => new Promise((res) => { setTimeout(() => { res(value); }, 100); });
    const createRejectedPromise = () => new Promise((_, rej) => { setTimeout(() => { rej(value); }, 100); });

    promiseWrapper(createResolvedPromise(), failHandler);
    promiseWrapper(createResolvedPromise(), failHandler).then(passHandler);
    promiseWrapper(createResolvedPromise(), failHandler).then(passHandler, failHandler);
    promiseWrapper(createResolvedPromise(), failHandler).then(passHandler).catch(failHandler);
    promiseWrapper(createResolvedPromise(), failHandler).then(passHandler).catch(failHandler).then(passHandler);
    promiseWrapper(createResolvedPromise(), failHandler).then(passHandler).then(passHandler).catch(failHandler).then(passHandler);
    promiseWrapper(createResolvedPromise(), failHandler).then(passHandler).then(passHandlerWithThrow).catch(passHandler).then(passHandler);

    promiseWrapper(createRejectedPromise(), passHandler);
    promiseWrapper(createRejectedPromise(), passHandler).then(failHandler);
    promiseWrapper(createRejectedPromise(), failHandler).then(failHandler).then(failHandler).catch(passHandler);
    promiseWrapper(createRejectedPromise(), passHandler).then(failHandler).then(failHandler);
    promiseWrapper(createRejectedPromise(), failHandler).then(failHandler, passHandler);
    promiseWrapper(createRejectedPromise(), failHandler).then(failHandler).catch(passHandler);
    promiseWrapper(createRejectedPromise(), failHandler).then(failHandler).then(failHandler, passHandler);
    promiseWrapper(createRejectedPromise(), failHandler).then(failHandler).catch(passHandler).then(passHandler);

    setTimeout(() => {
      expect.assertions(21);
      done();
    }, 1000);

  });

  it('the wrapped promise must properly operate with async/await ', async (done) => {

    const value = 'value';
    const failHandler = () => { expect(true).toBe(false); };
    const passHandler = (val: any) => { expect(val).toBe(value); return val; };
    const passHandlerWithThrow = (val: any) => { expect(val).toBe(value); throw val; };
    const createResolvedPromise = () => new Promise((res) => { setTimeout(() => { res(value); }, 100); });
    const createRejectedPromise = () => new Promise((_, rej) => { setTimeout(() => { rej(value); }, 100); });

    try {
      const result = await promiseWrapper(createResolvedPromise(), failHandler);
      passHandler(result);
    } catch (result) {
      failHandler();
    }

    try {
      const result = await promiseWrapper(createRejectedPromise(), failHandler);
      failHandler();
    } catch (result) {
      passHandler(result);
    }

    let result;
    try {
      result = await promiseWrapper(createResolvedPromise(), failHandler);
      passHandler(result);
      passHandlerWithThrow(result);
    } catch (error) {
      result = passHandler(error);
    }
    passHandler(result);

    setTimeout(() => {
      expect.assertions(6);
      done();
    }, 1000);

  });

});
