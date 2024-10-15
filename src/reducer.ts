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

function setStatus(state: ISplitState, patch: Partial<IStatus>, action: ISplitAction) {
  const { timestamp, key, nonDefaultKey } = action.payload;

  return nonDefaultKey || (nonDefaultKey === undefined && key) ? {
    ...state,
    status: {
      ...state.status,
      [key]: state.status && state.status[key] ? {
        ...state.status[key],
        ...patch,
        lastUpdate: timestamp,
      } : {
        ...initialStatus,
        ...patch,
        lastUpdate: timestamp,
      }
    },
  } : {
    ...state,
    ...patch,
    lastUpdate: timestamp,
  };
}

function setReady(state: ISplitState, action: ISplitAction) {
  return setStatus(state, {
    isReady: true,
    isTimedout: false,
  }, action);
}

function setReadyFromCache(state: ISplitState, action: ISplitAction) {
  return setStatus(state, {
    isReadyFromCache: true,
  }, action);
}

function setTimedout(state: ISplitState, action: ISplitAction) {
  return setStatus(state, {
    isTimedout: true,
    hasTimedout: true,
  }, action);
}

function setUpdated(state: ISplitState, action: ISplitAction) {
  return setStatus(state, {}, action);
}

function setDestroyed(state: ISplitState, action: ISplitAction) {
  return setStatus(state, {
    isDestroyed: true,
  }, action);
}

/**
 * Copy the given `treatments` for the given `key` to a `result` Split's slice of state. Returns the `result` object.
 */
function assignTreatments(result: ISplitState, action: ISplitAction): ISplitState {
  const { key, treatments } = action.payload;

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
      return setReady(state, action as ISplitAction);

    case SPLIT_READY_FROM_CACHE:
      return setReadyFromCache(state, action as ISplitAction);

    case SPLIT_TIMEDOUT:
      return setTimedout(state, action as ISplitAction);

    case SPLIT_UPDATE:
      return setUpdated(state, action as ISplitAction);

    case SPLIT_DESTROY:
      return setDestroyed(state, action as ISplitAction);

    case ADD_TREATMENTS: {
      const result = { ...state };
      return assignTreatments(result, action as ISplitAction);
    }

    case SPLIT_READY_WITH_EVALUATIONS: {
      const result = setReady(state, action as ISplitAction);
      return assignTreatments(result, action as ISplitAction);
    }

    case SPLIT_READY_FROM_CACHE_WITH_EVALUATIONS: {
      const result = setReadyFromCache(state, action as ISplitAction);
      return assignTreatments(result, action as ISplitAction);
    }

    case SPLIT_UPDATE_WITH_EVALUATIONS: {
      const result = setUpdated(state, action as ISplitAction);
      return assignTreatments(result, action as ISplitAction);
    }

    default:
      return state;
  }
};
