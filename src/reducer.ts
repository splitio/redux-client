import { Reducer } from 'redux';
import { ISplitState } from './types';
import {
  SPLIT_READY, SPLIT_READY_WITH_EVALUATIONS, SPLIT_READY_FROM_CACHE, SPLIT_READY_FROM_CACHE_WITH_EVALUATIONS,
  SPLIT_UPDATE, SPLIT_UPDATE_WITH_EVALUATIONS, SPLIT_TIMEDOUT, SPLIT_DESTROY, ADD_TREATMENTS,
} from './constants';

export const initialStatus = {
  isReady: false,
  isReadyFromCache: false,
  isTimedout: false,
  hasTimedout: false,
  isDestroyed: false,
  lastUpdate: 0,
}

/**
 * Initial default state for Split reducer
 */
const initialState: ISplitState = {
  ...initialStatus,
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

function setUpdated(state: ISplitState, timestamp: number) {
  return {
    ...state,
    lastUpdate: timestamp,
  };
}

/**
 * Copy the given `treatments` for the given `key` to a `result` Split's slice of state. Returns the `result` object.
 */
function assignTreatments(result: ISplitState, key: string, treatments: SplitIO.TreatmentsWithConfig): ISplitState {
  result.treatments = { ...result.treatments };
  Object.entries<SplitIO.TreatmentWithConfig>(treatments).forEach(([featureFlagName, treatment]) => {
    if (result.treatments[featureFlagName]) {
      const splitTreatments = result.treatments[featureFlagName];
      if (!splitTreatments[key] || splitTreatments[key].treatment !== treatment.treatment || splitTreatments[key].config !== treatment.config) {
        result.treatments[featureFlagName] = {
          ...(result.treatments[featureFlagName]),
          [key]: treatment,
        };
      }
    } else {
      result.treatments[featureFlagName] = { [key]: treatment };
    }
  });
  return result;
}

/**
 * Split reducer.
 * It updates the Split's slice of state.
 */
export const splitReducer: Reducer<ISplitState> = function (
  state = initialState,
  action,
) {
  switch (action.type) {
    case SPLIT_READY:
      return setReady(state, (action as any).payload.timestamp);

    case SPLIT_READY_FROM_CACHE:
      return setReadyFromCache(state, (action as any).payload.timestamp);

    case SPLIT_TIMEDOUT:
      return {
        ...state,
        isTimedout: true,
        hasTimedout: true,
        lastUpdate: (action as any).payload.timestamp,
      };

    case SPLIT_UPDATE:
      return setUpdated(state, (action as any).payload.timestamp);

    case SPLIT_DESTROY:
      return {
        ...state,
        isDestroyed: true,
        lastUpdate: (action as any).payload.timestamp,
      };

    case ADD_TREATMENTS: {
      const { key, treatments } = (action as any).payload;
      const result = { ...state };
      return assignTreatments(result, key, treatments);
    }

    case SPLIT_READY_WITH_EVALUATIONS: {
      const { key, treatments, timestamp } = (action as any).payload;
      const result = setReady(state, timestamp);
      return assignTreatments(result, key, treatments);
    }

    case SPLIT_READY_FROM_CACHE_WITH_EVALUATIONS: {
      const { key, treatments, timestamp } = (action as any).payload;
      const result = setReadyFromCache(state, timestamp);
      return assignTreatments(result, key, treatments);
    }

    case SPLIT_UPDATE_WITH_EVALUATIONS: {
      const { key, treatments, timestamp } = (action as any).payload;
      const result = setUpdated(state, timestamp);
      return assignTreatments(result, key, treatments);
    }

    default:
      return state;
  }
};
