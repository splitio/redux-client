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
export interface IClientStatus {
  isReady: boolean;
  isReadyFromCache: boolean;
  isOperational: boolean;
  hasTimedout: boolean;
  isDestroyed: boolean;
}

export function getStatus(client: SplitIO.IClient): IClientStatus {
  // @ts-expect-error, function exists but it is not part of JS SDK type definitions
  return client.__getStatus();
}
