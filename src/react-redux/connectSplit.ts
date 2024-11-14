import { connect } from 'react-redux';
import { getTreatments } from '../asyncActions';
import { ISplitState, IGetSplitState } from '../types';
import { defaultGetSplitState } from '../selectors';

/**
 * This decorator connects your components with:
 * - The Split state at Redux, under the prop key `split`.
 * - The action creator `getTreatments`, bound to the `dispatch` of your store.
 *
 * @param getSplitState - Optional function that takes the entire Redux state and returns
 * the state slice which corresponds to where the Split reducer was mounted. This functionality is rarely
 * needed, and defaults to assuming that the reducer is mounted under the `splitio` key.
 */
export function connectSplit(getSplitState: IGetSplitState = defaultGetSplitState) {

  function mapSplitStateToProps(state: any) {
    const splitState: ISplitState = getSplitState(state);
    return {
      splitio: splitState,
    };
  }
  return connect(mapSplitStateToProps, { getTreatments });

}
