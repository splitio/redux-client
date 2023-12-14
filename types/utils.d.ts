import { IGetTreatmentsParams } from './types';
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
/**
 * Validates and sanitizes the parameters passed to the "getTreatments" action creator.
 *
 * @returns {IGetTreatmentsParams} The returned object is a copy of the passed one, with the "splitNames" property converted to an array of strings.
 */
export declare function validateGetTreatmentsParams(params: IGetTreatmentsParams): {
    splitNames: string[];
    key?: import("@splitsoftware/splitio/types/splitio").SplitKey;
    attributes?: import("@splitsoftware/splitio/types/splitio").Attributes;
    evalOnUpdate?: boolean;
    evalOnReadyFromCache?: boolean;
};
