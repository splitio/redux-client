import { Reducer } from 'redux';
import { ISplitAction, ISplitState, IStatus } from './types';
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

function setStatus(state: ISplitState, patch: Partial<IStatus>, key?: string) {
  return key ? {
    ...state,
    status: {
      ...state.status,
      [key]: state.status && state.status[key] ? {
        ...state.status[key],
        ...patch,
      } : {
        ...initialStatus,
        ...patch,
      }
    },
  } : {
    ...state,
    ...patch,
  };
}

function setReady(state: ISplitState, timestamp: number, key?: string) {
  return setStatus(state, {
    isReady: true,
    isTimedout: false,
    lastUpdate: timestamp,
  }, key);
}

function setReadyFromCache(state: ISplitState, timestamp: number, key?: string) {
  return setStatus(state, {
    isReadyFromCache: true,
    lastUpdate: timestamp,
  }, key);
}

function setTimedout(state: ISplitState, timestamp: number, key?: string) {
  return setStatus(state, {
    isTimedout: true,
    hasTimedout: true,
    lastUpdate: timestamp,
  }, key);
}

function setUpdated(state: ISplitState, timestamp: number, key?: string) {
  return setStatus(state, {
    lastUpdate: timestamp,
  }, key);
}

function setDestroyed(state: ISplitState, timestamp: number, key?: string) {
  return setStatus(state, {
    isDestroyed: true,
    lastUpdate: timestamp,
  }, key);
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
  const { type, payload: { timestamp, key, treatments, nonDefaultKey } = {} } = action as ISplitAction;

  switch (type) {
    case SPLIT_READY:
      return setReady(state, timestamp, key);

    case SPLIT_READY_FROM_CACHE:
      return setReadyFromCache(state, timestamp, key);

    case SPLIT_TIMEDOUT:
      return setTimedout(state, timestamp, key);

    case SPLIT_UPDATE:
      return setUpdated(state, timestamp, key);

    case SPLIT_DESTROY:
      return setDestroyed(state, timestamp, key);

    case ADD_TREATMENTS: {
      const result = { ...state };
      return assignTreatments(result, key, treatments);
    }

    case SPLIT_READY_WITH_EVALUATIONS: {
      const result = setReady(state, timestamp, nonDefaultKey && key);
      return assignTreatments(result, key, treatments);
    }

    case SPLIT_READY_FROM_CACHE_WITH_EVALUATIONS: {
      const result = setReadyFromCache(state, timestamp, nonDefaultKey && key);
      return assignTreatments(result, key, treatments);
    }

    case SPLIT_UPDATE_WITH_EVALUATIONS: {
      const result = setUpdated(state, timestamp, nonDefaultKey && key);
      return assignTreatments(result, key, treatments);
    }

    default:
      return state;
  }
};
