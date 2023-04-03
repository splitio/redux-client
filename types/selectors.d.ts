import { ISplitState } from './types';
export declare const getStateSlice: (sliceName: string) => (state: any) => any;
export declare const defaultGetSplitState: (state: any) => any;
/**
 * Selector function to extract a treatment evaluation from the Split state. It returns the treatment string value.
 *
 * @param {ISplitState} splitState
 * @param {string} splitName
 * @param {SplitIO.SplitKey} key
 * @param {string} defaultValue
 */
export declare function selectTreatmentValue(splitState: ISplitState, splitName: string, key?: SplitIO.SplitKey, defaultValue?: string): string;
/**
 * Selector function to extract a treatment evaluation from the Split state. It returns a treatment object containing its value and configuration.
 *
 * @param {ISplitState} splitState
 * @param {string} splitName
 * @param {SplitIO.SplitKey} key
 * @param {TreatmentWithConfig} defaultValue
 */
export declare function selectTreatmentWithConfig(splitState: ISplitState, splitName: string, key?: SplitIO.SplitKey, defaultValue?: SplitIO.TreatmentWithConfig): SplitIO.TreatmentWithConfig;
