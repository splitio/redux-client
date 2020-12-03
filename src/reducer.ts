import { Reducer } from 'redux';
import { ISplitState } from './types';
import {
  SPLIT_READY, SPLIT_READY_WITH_EVALUATIONS, SPLIT_READY_FROM_CACHE, SPLIT_READY_FROM_CACHE_WITH_EVALUATIONS,
  SPLIT_UPDATE, SPLIT_UPDATE_WITH_EVALUATIONS, SPLIT_TIMEDOUT, SPLIT_DESTROY, ADD_TREATMENTS,
} from './constants';

/**
 * Initial default state for Split reducer
 */
const initialState: ISplitState = {
  isReady: false,
  isReadyFromCache: false,
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
  const type = action.type;
  let result = state;

  if (type === SPLIT_READY || type === SPLIT_READY_WITH_EVALUATIONS)
    result = {
      ...state,
      isReady: true,
      isTimedout: false,
      lastUpdate: action.payload.timestamp,
    }; // SDK_READY of main client

  if (type === SPLIT_READY_FROM_CACHE || type === SPLIT_READY_FROM_CACHE_WITH_EVALUATIONS)
    result = {
      ...state,
      isReadyFromCache: true,
      lastUpdate: action.payload.timestamp,
    }; // SPLIT_READY_FROM_CACHE of main client

  if (type === SPLIT_TIMEDOUT)
    result = {
      ...state,
      isTimedout: true,
      hasTimedout: true,
      lastUpdate: action.payload.timestamp,
    }; // SPLIT_TIMEDOUT of main client

  if (type === SPLIT_UPDATE || type === SPLIT_UPDATE_WITH_EVALUATIONS)
    result = {
      ...state,
      lastUpdate: action.payload.timestamp,
    }; // SPLIT_UPDATE of main client

  if (type === SPLIT_DESTROY)
    return {
      ...state,
      isDestroyed: true,
      lastUpdate: action.payload.timestamp,
    }; // SPLIT_DESTROY of main client

  if (type === ADD_TREATMENTS)
    result = { ...state };

  if (type === SPLIT_READY_WITH_EVALUATIONS || type === SPLIT_READY_FROM_CACHE_WITH_EVALUATIONS || type === SPLIT_UPDATE_WITH_EVALUATIONS || type === ADD_TREATMENTS) {
    const { key, treatments } = action.payload;
    result.treatments = { ...state.treatments };
    Object.entries<SplitIO.TreatmentWithConfig>(treatments).forEach(([splitName, treatment]) => {
      if (result.treatments[splitName]) {
        const splitTreatments = result.treatments[splitName];
        if (!splitTreatments[key] || splitTreatments[key].treatment !== treatment.treatment || splitTreatments[key].config !== treatment.config) {
          result.treatments[splitName] = {
            ...(result.treatments[splitName]),
            [key]: treatment,
          };
        }
      } else {
        result.treatments[splitName] = { [key]: treatment };
      }
    });
  }
  return result;
};

export default splitReducer;
