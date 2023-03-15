import { getTreatments } from '../asyncActions';
import { ISplitState, IGetSplitState } from '../types';
/**
 * This decorator connects your components with:
 * - The Split state at Redux, under the prop key `split`.
 * - The action creator `getTreatments`, binded to the `dispatch` of your store.
 *
 * @param {IGetSplitState} getSplitState optional function that takes the entire Redux state and returns
 * the state slice which corresponds to where the Split reducer was mounted. This functionality is rarely
 * needed, and defaults to assuming that the reducer is mounted under the `splitio` key.
 */
export declare function connectSplit(getSplitState?: IGetSplitState): import("react-redux").InferableComponentEnhancerWithProps<{
    splitio: ISplitState;
} & {
    getTreatments: typeof getTreatments;
}, {}>;
