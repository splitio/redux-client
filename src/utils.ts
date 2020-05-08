/**
 * Validates if a value is an object.
 */
export function isObject(obj: any) {
  return obj && typeof obj === 'object' && obj.constructor === Object;
}

/**
 * Verify type of key and return either its matchingKey or itself
 */
export function matching(key: SplitIO.SplitKey): string {
  return isObject(key) ? (key as SplitIO.SplitKeyObject).matchingKey : (key as string);
}

/**
 * wraps a given promise in a new promise with a default onRejected function,
 * that handles the promise rejection if not other onRejected handler is provided.
 *
 * @param customPromise promise to wrap
 * @param defaultOnRejected default onRejected function
 */
export function promiseWrapper(customPromise: Promise<any>, defaultOnRejected: (_: any) => any): Promise<any> {

  let hasCatch = false;

  function chain(promise: Promise<any>) {
    const newPromise: Promise<any> = new Promise((res, rej) => {
      return promise.then(
        res,
        function(value) {
          if (hasCatch)
            rej(value);
          else
            defaultOnRejected(value);
        },
      );
    });

    const originalThen = newPromise.then;

    newPromise.then = function(onfulfilled, onrejected) {
      if (typeof onrejected === 'function') {
        hasCatch = true;
      }
      return chain(originalThen.call(newPromise, onfulfilled, onrejected));
    };

    return newPromise;
  }

  return chain(customPromise);
}
