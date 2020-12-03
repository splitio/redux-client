import reducer from '../reducer';
import { splitReady, splitReadyWithEvaluations, splitReadyFromCache, splitReadyFromCacheWithEvaluations, splitTimedout, splitUpdate, splitUpdateWithEvaluations, splitDestroy, addTreatments } from '../actions';
import { ISplitState } from '../types';
import SplitIO from '@splitsoftware/splitio/types/splitio';

const initialState: ISplitState = {
  isReady: false,
  isReadyFromCache: false,
  isTimedout: false,
  hasTimedout: false,
  isDestroyed: false,
  lastUpdate: 0,
  treatments: {},
};

const key = 'userkey';

const treatments: SplitIO.TreatmentsWithConfig = {
  test_split: {
    treatment: 'on',
    config: null,
  },
};

const stateWithTreatments: ISplitState = {
  ...initialState,
  treatments: {
    test_split: {
      [key]: treatments.test_split,
    },
  },
};

describe('Split reducer', () => {
  it('should return the initial state', () => {
    expect(reducer(undefined, ({} as any))).toEqual(initialState);
  });

  it('should handle SPLIT_READY', () => {
    const readyAction = splitReady();
    expect(
      reducer(initialState, readyAction),
    ).toEqual({
      ...initialState,
      isReady: true,
      lastUpdate: readyAction.payload.timestamp,
    });
  });

  it('should handle SPLIT_READY_FROM_CACHE', () => {
    const readyAction = splitReadyFromCache();
    expect(
      reducer(initialState, readyAction),
    ).toEqual({
      ...initialState,
      isReadyFromCache: true,
      lastUpdate: readyAction.payload.timestamp,
    });
  });

  it('should handle SPLIT_TIMEDOUT', () => {
    const timedoutAction = splitTimedout();
    expect(
      reducer(initialState, timedoutAction),
    ).toEqual({
      ...initialState,
      isTimedout: true,
      hasTimedout: true,
      lastUpdate: timedoutAction.payload.timestamp,
    });
  });

  it('should handle SPLIT_READY after SPLIT_TIMEDOUT', () => {
    const timedoutAction = splitTimedout();
    const readyAction = splitReady();
    expect(
      reducer(reducer(initialState, timedoutAction), readyAction),
    ).toEqual({
      ...initialState,
      isReady: true,
      isTimedout: false,
      hasTimedout: true,
      lastUpdate: readyAction.payload.timestamp,
    });
  });

  it('should handle SPLIT_UPDATE', () => {
    const updateAction = splitUpdate();
    expect(
      reducer(initialState, updateAction),
    ).toEqual({
      ...initialState,
      lastUpdate: updateAction.payload.timestamp,
    });
  });

  it('should handle SPLIT_DESTROY', () => {
    const destroyAction = splitDestroy();
    expect(
      reducer(initialState, destroyAction),
    ).toEqual({
      ...initialState,
      isDestroyed: true,
      lastUpdate: destroyAction.payload.timestamp,
    });
  });

  it('should handle ADD_TREATMENTS', () => {
    const addTreatmentsAction = addTreatments(key, treatments);
    expect(
      reducer(initialState, addTreatmentsAction),
    ).toEqual({
      ...initialState,
      treatments: {
        test_split: {
          [key]: treatments.test_split,
        },
      },
    });
  });

  it('should not override a treatment for an existing key and split name, if the treatment is the same', () => {
    const previousTreatment = stateWithTreatments.treatments.test_split[key];
    const newTreatments: SplitIO.TreatmentsWithConfig = {
      test_split: { ...previousTreatment },
    };
    const addTreatmentsAction = addTreatments(key, newTreatments);
    const reduxState = reducer(stateWithTreatments, addTreatmentsAction);
    expect(reduxState.treatments.test_split[key]).toBe(previousTreatment);
    expect(
      reduxState,
    ).toEqual({
      ...initialState,
      treatments: {
        test_split: {
          [key]: newTreatments.test_split,
        },
      },
    });
  });

  it('should override a treatment for an existing key and split name, if the treatment is different', () => {
    const previousTreatment = stateWithTreatments.treatments.test_split[key];
    const newTreatments: SplitIO.TreatmentsWithConfig = {
      test_split: {
        treatment: previousTreatment.treatment === 'on' ? 'off' : 'on',
        config: null,
      },
    };
    const addTreatmentsAction = addTreatments(key, newTreatments);
    const reduxState = reducer(stateWithTreatments, addTreatmentsAction);
    expect(reduxState.treatments.test_split[key]).not.toBe(previousTreatment);
    expect(
      reduxState,
    ).toEqual({
      ...initialState,
      treatments: {
        test_split: {
          [key]: newTreatments.test_split,
        },
      },
    });
  });

  it('should handle SPLIT_READY_WITH_EVALUATIONS', () => {
    const action = splitReadyWithEvaluations(key, treatments);
    expect(
      reducer(initialState, action),
    ).toEqual({
      ...initialState,
      isReady: true,
      lastUpdate: action.payload.timestamp,
      treatments: {
        test_split: {
          [key]: treatments.test_split,
        },
      },
    });
  });

  it('should handle SPLIT_READY_FROM_CACHE_WITH_EVALUATIONS', () => {
    const action = splitReadyFromCacheWithEvaluations(key, treatments);
    expect(
      reducer(initialState, action),
    ).toEqual({
      ...initialState,
      isReadyFromCache: true,
      lastUpdate: action.payload.timestamp,
      treatments: {
        test_split: {
          [key]: treatments.test_split,
        },
      },
    });
  });

  it('should handle SPLIT_UPDATE_WITH_EVALUATIONS', () => {
    const action = splitUpdateWithEvaluations(key, treatments);
    expect(
      reducer(initialState, action),
    ).toEqual({
      ...initialState,
      lastUpdate: action.payload.timestamp,
      treatments: {
        test_split: {
          [key]: treatments.test_split,
        },
      },
    });
  });

});
