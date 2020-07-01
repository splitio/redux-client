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
