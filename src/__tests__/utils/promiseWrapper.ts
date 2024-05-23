/**
 * wraps a given promise in a new one with a default onRejected function,
 * that handles the promise rejection if not other onRejected handler is provided.
 *
 * Caveats: there are some cases where the `defaultOnRejected` handler is not invoked
 * and the promise rejection must be handled by the user (same as the Promise spec):
 *  - using async/await syntax
 *  - setting an `onFinally` handler as the first handler (e.g. `promiseWrapper(Promise.reject()).finally(...)`)
 *  - setting more than one handler with at least one of them being an onRejected handler
 *
 * @param customPromise promise to wrap
 * @param defaultOnRejected default onRejected function
 * @returns a promise that doesn't need to be handled for rejection (except when using async/await syntax).
 */
export default function promiseWrapper(customPromise: Promise<any>, defaultOnRejected: (_: any) => any): Promise<any> {

  let hasOnRejected = false;

  function chain(promise: Promise<any>) {
    const newPromise: Promise<any> = new Promise((res, rej) => {
      return promise.then(
        res,
        function (value: any) {
          if (hasOnRejected) {
            rej(value);
          } else {
            defaultOnRejected(value);
          }
        },
      );
    });

    const originalThen = newPromise.then;

    newPromise.then = function (onfulfilled?: any, onrejected?: any) {
      const result: Promise<any> = originalThen.call(newPromise, onfulfilled, onrejected);
      if (typeof onrejected === 'function') {
        hasOnRejected = true;
        return result;
      } else {
        return chain(result);
      }
    };

    return newPromise;
  }

  return chain(customPromise);
}
