/**
 * Validates if a value is an object.
 */
export declare function isObject(obj: unknown): boolean;
/**
 * Verify type of key and return either its matchingKey or itself
 */
export declare function matching(key: SplitIO.SplitKey): string;
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
export declare function getStatus(client: SplitIO.IClient): IClientStatus;
