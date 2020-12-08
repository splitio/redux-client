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

function setReady(state: ISplitState, timestamp: number) {
  return {
    ...state,
    isReady: true,
    isTimedout: false,
    lastUpdate: timestamp,
  };
}

function setReadyFromCache(state: ISplitState, timestamp: number) {
  return {
    ...state,
    isReadyFromCache: true,
    lastUpdate: timestamp,
  };
}

function setTimedout(state: ISplitState, timestamp: number) {
  return {
    ...state,
    isTimedout: true,
    hasTimedout: true,
    lastUpdate: timestamp,
  };
}

function setUpdated(state: ISplitState, timestamp: number) {
  return {
    ...state,
    lastUpdate: timestamp,
  };
}

function setDestroyed(state: ISplitState, timestamp: number) {
  return {
    ...state,
    isDestroyed: true,
    lastUpdate: timestamp,
  };
}

/**
 * Copy the given `treatments` for the given `key` to a `result` Split's slice of state. Returns the `result` object.
 */
function assignTreatments(result: ISplitState, key: string, treatments: SplitIO.TreatmentsWithConfig): ISplitState {
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
  return result;
}

/**
 * Split reducer.
 * It updates the Split's slice of state.
 */
const splitReducer: Reducer<ISplitState> = function(
  state = initialState,
  action,
) {
  switch (action.type) {
    case SPLIT_READY:
      return setReady(state, action.payload.timestamp);

    case SPLIT_READY_FROM_CACHE:
      return setReadyFromCache(state, action.payload.timestamp);

    case SPLIT_TIMEDOUT:
      return setTimedout(state, action.payload.timestamp);

    case SPLIT_UPDATE:
      return setUpdated(state, action.payload.timestamp);

    case SPLIT_DESTROY:
      return setDestroyed(state, action.payload.timestamp);

    case ADD_TREATMENTS: {
      const { key, treatments } = action.payload;
      const result = { ...state };
      result.treatments = { ...state.treatments };
      return assignTreatments(result, key, treatments);
    }

    case SPLIT_READY_WITH_EVALUATIONS: {
      const { key, treatments, timestamp } = action.payload;
      const result = setReady(state, timestamp);
      result.treatments = { ...state.treatments };
      return assignTreatments(result, key, treatments);
    }

    case SPLIT_READY_FROM_CACHE_WITH_EVALUATIONS: {
      const { key, treatments, timestamp } = action.payload;
      const result = setReadyFromCache(state, timestamp);
      result.treatments = { ...state.treatments };
      return assignTreatments(result, key, treatments);
    }

    case SPLIT_UPDATE_WITH_EVALUATIONS: {
      const { key, treatments, timestamp } = action.payload;
      const result = setUpdated(state, timestamp);
      result.treatments = { ...state.treatments };
      return assignTreatments(result, key, treatments);
    }

    default:
      return state;
  }
};

export default splitReducer;
