import { Reducer } from 'redux';
import { ISplitState } from './types';
import { SPLIT_READY, SPLIT_TIMEDOUT, SPLIT_UPDATE, SPLIT_DESTROY, ADD_TREATMENTS } from './constants';

/**
 * Initial default state for Split reducer
 */
const initialState: ISplitState = {
  isReady: false,
  isTimedout: false,
  hasTimedout: false,
  isDestroyed: false,
  lastUpdate: 0,
  treatments: {},
};

/**
 * Split reducer.
 * It tracks the SDK status and saves treatment evaluations for different splits (features) that we use in the app.
 */
const splitReducer: Reducer<ISplitState> = function(
  state = initialState,
  action,
) {
  switch (action.type) {
    case SPLIT_READY:
      return {
        ...state,
        isReady: true,
        isTimedout: false,
        lastUpdate: action.payload.timestamp,
      };

    case SPLIT_TIMEDOUT:
      return {
        ...state,
        isTimedout: true,
        hasTimedout: true,
        lastUpdate: action.payload.timestamp,
      };

    case SPLIT_UPDATE:
      return {
        ...state,
        lastUpdate: action.payload.timestamp,
      };

    case SPLIT_DESTROY:
      return {
        ...state,
        isDestroyed: true,
        lastUpdate: action.payload.timestamp,
      };

    case ADD_TREATMENTS:
      const { key, treatments } = action.payload;

      // return the same state if no treatments have changed
      const treatmentsToChange = Object.entries<SplitIO.TreatmentWithConfig>(treatments).filter(([splitName, treatment]) => {
        if (!state.treatments[splitName]) return true;
        const splitTreatments = state.treatments[splitName];
        if (!splitTreatments[key] ||
          splitTreatments[key].treatment !== treatment.treatment ||
          splitTreatments[key].config !== treatment.config) return true;
        return false;
      });

      if (treatmentsToChange.length === 0) return state;

      // return the updated state if any treatment have changed
      const result: ISplitState = {
        ...state,
        treatments: { ...state.treatments },
      };

      treatmentsToChange.forEach(([splitName, treatment]) => {
        if (result.treatments[splitName]) {
          result.treatments[splitName] = {
            ...(result.treatments[splitName]),
            [key]: treatment,
          };
        } else {
          result.treatments[splitName] = { [key]: treatment };
        }
      });
      return result;

    default:
      return state;
  }
};

export default splitReducer;
