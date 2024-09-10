import { Reducer } from 'redux';
import { ISplitState, IStatus } from './types';
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

function setStatus(state: ISplitState, patch: Partial<IStatus>) {
  return {
    ...state,
    ...patch,
  };
}

function setReady(state: ISplitState, timestamp: number) {
  return setStatus(state, {
    isReady: true,
    isTimedout: false,
    lastUpdate: timestamp,
  });
}

function setReadyFromCache(state: ISplitState, timestamp: number) {
  return setStatus(state, {
    isReadyFromCache: true,
    lastUpdate: timestamp,
  });
}

function setTimedout(state: ISplitState, timestamp: number) {
  return setStatus(state, {
    isTimedout: true,
    hasTimedout: true,
    lastUpdate: timestamp,
  });
}

function setUpdated(state: ISplitState, timestamp: number) {
  return setStatus(state, {
    lastUpdate: timestamp,
  });
}

function setDestroyed(state: ISplitState, timestamp: number) {
  return setStatus(state, {
    isDestroyed: true,
    lastUpdate: timestamp,
  });
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
  const { type, payload: { timestamp, key, treatments } = {} as any } = action as any;

  switch (type) {
    case SPLIT_READY:
      return setReady(state, timestamp);

    case SPLIT_READY_FROM_CACHE:
      return setReadyFromCache(state, timestamp);

    case SPLIT_TIMEDOUT:
      return setTimedout(state, timestamp);

    case SPLIT_UPDATE:
      return setUpdated(state, timestamp);

    case SPLIT_DESTROY:
      return setDestroyed(state, timestamp);

    case ADD_TREATMENTS: {
      const result = { ...state };
      return assignTreatments(result, key, treatments);
    }

    case SPLIT_READY_WITH_EVALUATIONS: {
      const result = setReady(state, timestamp);
      return assignTreatments(result, key, treatments);
    }

    case SPLIT_READY_FROM_CACHE_WITH_EVALUATIONS: {
      const result = setReadyFromCache(state, timestamp);
      return assignTreatments(result, key, treatments);
    }

    case SPLIT_UPDATE_WITH_EVALUATIONS: {
      const result = setUpdated(state, timestamp);
      return assignTreatments(result, key, treatments);
    }

    default:
      return state;
  }
};
