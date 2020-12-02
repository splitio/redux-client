import { Reducer } from 'redux';
import { ISplitState, IKeyTreatments } from './types';
import { SPLIT_READY, SPLIT_READY_WITH_EVALUATIONS, SPLIT_READY_FROM_CACHE, SPLIT_TIMEDOUT, SPLIT_UPDATE, SPLIT_DESTROY, ADD_TREATMENTS, ADD_EVALUATIONS } from './constants';

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

function mapTreatments(result: ISplitState, key: string, treatments: IKeyTreatments): ISplitState {
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
 * It tracks the SDK status and saves treatment evaluations for different splits (features) that we use in the app.
 */
const splitReducer: Reducer<ISplitState> = function(
  state = initialState,
  action,
) {
  let result: ISplitState;

  switch (action.type) {
    case SPLIT_READY:
      return {
        ...state,
        isReady: true,
        isTimedout: false,
        lastUpdate: action.payload.timestamp,
      };
// @TODO: build for ready_from_cache if applicable
    case SPLIT_READY_WITH_EVALUATIONS:
      result = {
        ...state,
        treatments: { ...state.treatments },
        isReady: true,
        isTimedout: false,
        lastUpdate: action.payload.timestamp,
      };

      action.payload.evaluations.forEach((evaluation: any) => {
        const { key, treatments } = evaluation;

        mapTreatments(result, key, treatments);
      });

      return result;

    case SPLIT_READY_FROM_CACHE:
      return {
        ...state,
        isReadyFromCache: true,
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
      result = {
        ...state,
        treatments: { ...state.treatments },
      };

      return mapTreatments(result, key, treatments);

    case ADD_EVALUATIONS:
      result = {
        ...state,
        treatments: { ...state.treatments },
      };

      action.payload.evaluations.forEach((evaluation: any) => {
        const { key, treatments } = evaluation;

        mapTreatments(result, key, treatments);
      });

      return result;

    default:
      return state;
  }
};

export default splitReducer;
