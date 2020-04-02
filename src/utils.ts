export function matching(key: SplitIO.SplitKey) {
  return typeof key === 'object' ? key.matchingKey : key;
}
