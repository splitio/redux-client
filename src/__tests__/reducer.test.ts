import { splitReducer } from '../reducer';
import { splitReady, splitReadyWithEvaluations, splitReadyFromCache, splitReadyFromCacheWithEvaluations, splitTimedout, splitUpdate, splitUpdateWithEvaluations, splitDestroy, addTreatments } from '../actions';
import { ISplitState } from '../types';
import SplitIO from '@splitsoftware/splitio/types/splitio';
import { AnyAction } from 'redux';

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
    config: '{"color": "green"}',
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
    expect(splitReducer(undefined, ({} as any))).toEqual(initialState);
  });

  it('should handle SPLIT_READY', () => {
    const readyAction = splitReady();
    expect(
      splitReducer(initialState, readyAction),
    ).toEqual({
      ...initialState,
      isReady: true,
      lastUpdate: readyAction.payload.timestamp,
    });
  });

  it('should handle SPLIT_READY_FROM_CACHE', () => {
    const readyAction = splitReadyFromCache();
    expect(
      splitReducer(initialState, readyAction),
    ).toEqual({
      ...initialState,
      isReadyFromCache: true,
      lastUpdate: readyAction.payload.timestamp,
    });
  });

  it('should handle SPLIT_TIMEDOUT', () => {
    const timedoutAction = splitTimedout();
    expect(
      splitReducer(initialState, timedoutAction),
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
      splitReducer(splitReducer(initialState, timedoutAction), readyAction),
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
      splitReducer(initialState, updateAction),
    ).toEqual({
      ...initialState,
      lastUpdate: updateAction.payload.timestamp,
    });
  });

  it('should handle SPLIT_DESTROY', () => {
    const destroyAction = splitDestroy();
    expect(
      splitReducer(initialState, destroyAction),
    ).toEqual({
      ...initialState,
      isDestroyed: true,
      lastUpdate: destroyAction.payload.timestamp,
    });
  });

  const actionCreatorsWithEvaluations: Array<[string, (key: SplitIO.SplitKey, treatments: SplitIO.TreatmentsWithConfig) => AnyAction, boolean, boolean]> = [
    ['ADD_TREATMENTS', addTreatments, false, false],
    ['SPLIT_READY_WITH_EVALUATIONS', splitReadyWithEvaluations, true, false],
    ['SPLIT_READY_FROM_CACHE_WITH_EVALUATIONS', splitReadyFromCacheWithEvaluations, false, true],
    ['SPLIT_UPDATE_WITH_EVALUATIONS', splitUpdateWithEvaluations, false, false],
  ];

  it.each(actionCreatorsWithEvaluations)('should handle %s', (_, actionCreator, isReady, isReadyFromCache) => {
    const initialTreatments = initialState.treatments;
    const action = actionCreator(key, treatments);

    // control assertion - reduced state has the expected shape
    expect(
      splitReducer(initialState, action),
    ).toEqual({
      ...initialState,
      isReady,
      isReadyFromCache,
      lastUpdate: action.payload.timestamp || initialState.lastUpdate,
      treatments: {
        test_split: {
          [key]: treatments.test_split,
        },
      },
    });

    expect(initialState.treatments).toBe(initialTreatments); // control-assert initialState treatments object shouldn't be replaced
    expect(initialState.treatments).toEqual({}); // control-assert initialState treatments object shouldn't be modified
  });

  it.each(actionCreatorsWithEvaluations)('%s should not override a treatment for an existing key and feature flag name, if the treatment is the same', (_, actionCreator, isReady, isReadyFromCache) => {
    // apply an action with a treatment with same value and config
    const previousTreatment = stateWithTreatments.treatments.test_split[key];
    const newTreatments: SplitIO.TreatmentsWithConfig = {
      test_split: { ...previousTreatment },
    };
    const action = actionCreator(key, newTreatments);
    const reduxState = splitReducer(stateWithTreatments, action);

    // control assertion - treatment object was not replaced in the state
    expect(reduxState.treatments.test_split[key]).toBe(previousTreatment);

    // control assertion - reduced state has the expected shape
    expect(
      reduxState,
    ).toEqual({
      ...initialState,
      isReady,
      isReadyFromCache,
      lastUpdate: action.payload.timestamp || initialState.lastUpdate,
      treatments: {
        test_split: {
          [key]: newTreatments.test_split,
        },
      },
    });
  });

  it.each(actionCreatorsWithEvaluations)('%s should override a treatment for an existing key and feature flag name, if the treatment is different (different treatment value)', (_, actionCreator, isReady, isReadyFromCache) => {
    // apply an action with a treatment with different value but same config
    const previousTreatment = stateWithTreatments.treatments.test_split[key];
    const newTreatments: SplitIO.TreatmentsWithConfig = {
      test_split: {
        treatment: previousTreatment.treatment === 'on' ? 'off' : 'on',
        config: previousTreatment.config,
      },
    };
    const action = actionCreator(key, newTreatments);
    const reduxState = splitReducer(stateWithTreatments, action);

    // control assertion - treatment object was replaced in the state
    expect(reduxState.treatments.test_split[key]).not.toBe(previousTreatment);
    // control assertion - reduced state has the expected shape
    expect(
      reduxState,
    ).toEqual({
      ...initialState,
      isReady,
      isReadyFromCache,
      lastUpdate: action.payload.timestamp || initialState.lastUpdate,
      treatments: {
        test_split: {
          [key]: newTreatments.test_split,
        },
      },
    });
  });

  it.each(actionCreatorsWithEvaluations)('%s should override a treatment for an existing key and feature flag name, if the treatment is different (different config value)', (_, actionCreator, isReady, isReadyFromCache) => {
    // apply an action with a treatment with same value but different config
    const previousTreatment = stateWithTreatments.treatments.test_split[key];
    const newTreatments: SplitIO.TreatmentsWithConfig = {
      test_split: {
        treatment: previousTreatment.treatment,
        config: previousTreatment.config === '{"color": "green"}' ? null : '{"color": "green"}',
      },
    };
    // const action = addTreatments(key, newTreatments);
    const action = actionCreator(key, newTreatments);
    const reduxState = splitReducer(stateWithTreatments, action);

    // control assertion - treatment object was replaced in the state
    expect(reduxState.treatments.test_split[key]).not.toBe(previousTreatment);
    // control assertion - reduced state has the expected shape
    expect(
      reduxState,
    ).toEqual({
      ...initialState,
      isReady,
      isReadyFromCache,
      lastUpdate: action.payload.timestamp || initialState.lastUpdate,
      treatments: {
        test_split: {
          [key]: newTreatments.test_split,
        },
      },
    });
  });

});
