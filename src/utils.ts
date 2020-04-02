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
