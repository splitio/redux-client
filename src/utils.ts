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
          if (hasCatch) {
            rej(value);
          } else {
            defaultOnRejected(value);
          }
        },
      );
    });

    const originalThen = newPromise.then;

    newPromise.then = function(onfulfilled?: any, onrejected?: any) {
      const result: Promise<any> = originalThen.call(newPromise, onfulfilled, onrejected);
      if (typeof onrejected === 'function') {
        hasCatch = true;
        return result;
      } else {
        return chain(result);
      }
    };

    return newPromise;
  }

  return chain(customPromise);
}

// The following utils might be removed in the future, if the JS SDK extends its public API with a "getStatus" method

/**
 * ClientWithContext interface.
 */
interface IClientWithContext extends SplitIO.IClient {
  __context: {
    constants: {
      READY: 'is_ready',
      READY_FROM_CACHE: 'is_ready_from_cache',
      HAS_TIMEDOUT: 'has_timedout',
      DESTROYED: 'is_destroyed',
    },
    get: (name: string, flagCheck: boolean) => boolean | undefined,
  };
}

export function getIsReady(client: SplitIO.IClient): boolean {
  return (client as IClientWithContext).__context.get((client as IClientWithContext).__context.constants.READY, true) ? true : false;
}

export function getIsReadyFromCache(client: SplitIO.IClient): boolean {
  return (client as IClientWithContext).__context.get((client as IClientWithContext).__context.constants.READY_FROM_CACHE, true) ? true : false;
}

export function getIsOperational(client: SplitIO.IClient): boolean {
  return getIsReady(client) || getIsReadyFromCache(client);
}
