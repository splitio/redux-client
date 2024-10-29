import { initialStatus, splitReducer } from '../reducer';
import { splitReady, splitReadyWithEvaluations, splitReadyFromCache, splitReadyFromCacheWithEvaluations, splitTimedout, splitUpdate, splitUpdateWithEvaluations, splitDestroy, addTreatments } from '../actions';
import { ISplitState } from '../types';
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
    const updatedState = splitReducer(initialState, splitReady(100));

    // default key
    expect(updatedState).toEqual({
      ...initialState,
      isReady: true,
      lastUpdate: 100,
    });

    // non-default key
    expect(splitReducer(updatedState, splitReady(200, { matchingKey: 'other_key', bucketingKey: 'bucketing' }))).toEqual({
      ...updatedState,
      status: {
        other_key: {
          ...initialStatus,
          isReady: true,
          lastUpdate: 200,
        }
      }
    });
  });

  it('should handle SPLIT_READY_FROM_CACHE', () => {
    const updatedState = splitReducer(initialState, splitReadyFromCache(200));

    // default key
    expect(updatedState).toEqual({
      ...updatedState,
      isReadyFromCache: true,
      lastUpdate: 200,
    });

    // non-default key
    expect(splitReducer(updatedState, splitReadyFromCache(300, 'other_key'))).toEqual({
      ...updatedState,
      status: {
        other_key: {
          ...initialStatus,
          isReadyFromCache: true,
          lastUpdate: 300,
        }
      }
    });
  });

  it('should handle SPLIT_TIMEDOUT', () => {
    const updatedState = splitReducer(initialState, splitTimedout(300));

    // default key
    expect(updatedState).toEqual({
      ...initialState,
      isTimedout: true,
      hasTimedout: true,
      lastUpdate: 300,
    });

    // non-default key
    expect(splitReducer(updatedState, splitTimedout(400, 'other_key'))).toEqual({
      ...updatedState,
      status: {
        other_key: {
          ...initialStatus,
          isTimedout: true,
          hasTimedout: true,
          lastUpdate: 400,
        }
      }
    });
  });

  it('should handle SPLIT_READY after SPLIT_TIMEDOUT', () => {
    const updatedState = splitReducer(splitReducer(initialState, splitTimedout(100)), splitReady(200));

    // default key
    expect(updatedState).toEqual({
      ...initialState,
      isReady: true,
      isTimedout: false,
      hasTimedout: true,
      lastUpdate: 200,
    });

    // non-default key
    expect(splitReducer(splitReducer(updatedState, splitTimedout(100, 'other_key')), splitReady(200, 'other_key'))).toEqual({
      ...updatedState,
      status: {
        other_key: {
          ...initialStatus,
          isReady: true,
          isTimedout: false,
          hasTimedout: true,
          lastUpdate: 200,
        }
      }
    });
  });

  it('should handle SPLIT_UPDATE', () => {
    const updatedState = splitReducer(initialState, splitUpdate(300));

    // default key
    expect(updatedState).toEqual({
      ...initialState,
      lastUpdate: 300,
    });

    // non-default key
    expect(splitReducer(updatedState, splitUpdate(400, 'other_key'))).toEqual({
      ...updatedState,
      status: {
        other_key: {
          ...initialStatus,
          lastUpdate: 400,
        }
      }
    });
  });

  it('should handle SPLIT_DESTROY', () => {
    const updatedState = splitReducer(initialState, splitDestroy(400));

    // default key
    expect(updatedState).toEqual({
      ...initialState,
      isDestroyed: true,
      lastUpdate: 400,
    });

    // non-default key
    expect(splitReducer(updatedState, splitDestroy(500, 'other_key'))).toEqual({
      ...updatedState,
      status: {
        other_key: {
          ...initialStatus,
          isDestroyed: true,
          lastUpdate: 500,
        }
      }
    });
  });

  const actionCreatorsWithEvaluations: Array<[string, (key: SplitIO.SplitKey, treatments: SplitIO.TreatmentsWithConfig, timestamp: number, nonDefaultKey?: boolean) => AnyAction, boolean, boolean]> = [
    ['ADD_TREATMENTS', addTreatments, false, false],
    ['SPLIT_READY_WITH_EVALUATIONS', splitReadyWithEvaluations, true, false],
    ['SPLIT_READY_FROM_CACHE_WITH_EVALUATIONS', splitReadyFromCacheWithEvaluations, false, true],
    ['SPLIT_UPDATE_WITH_EVALUATIONS', splitUpdateWithEvaluations, false, false],
  ];

  it.each(actionCreatorsWithEvaluations)('should handle %s', (_, actionCreator, isReady, isReadyFromCache) => {
    const initialTreatments = initialState.treatments;

    // default key
    const action = actionCreator(key, treatments, 1000, false);
    expect(splitReducer(initialState, action)).toEqual({
      ...initialState,
      isReady,
      isReadyFromCache,
      lastUpdate: action.type === 'ADD_TREATMENTS' ? initialState.lastUpdate : 1000,
      treatments: {
        test_split: {
          [key]: treatments.test_split,
        },
      },
    });

    // non-default key
    expect(splitReducer(initialState, actionCreator(key, treatments, 1000, true))).toEqual({
      ...initialState,
      treatments: {
        test_split: {
          [key]: treatments.test_split,
        },
      },
      status: action.type === 'ADD_TREATMENTS' ? undefined : {
        [key]: {
          ...initialStatus,
          isReady,
          isReadyFromCache,
          lastUpdate: 1000,
        }
      }
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
    const action = actionCreator(key, newTreatments, 1000, false);
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
      lastUpdate: action.type === 'ADD_TREATMENTS' ? initialState.lastUpdate : 1000,
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
    const action = actionCreator(key, newTreatments, 1000, false);
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
      lastUpdate: action.type === 'ADD_TREATMENTS' ? initialState.lastUpdate : 1000,
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
    const action = actionCreator(key, newTreatments, 1000, false);
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
      lastUpdate: action.type === 'ADD_TREATMENTS' ? initialState.lastUpdate : 1000,
      treatments: {
        test_split: {
          [key]: newTreatments.test_split,
        },
      },
    });
  });

  it('should ignore other actions', () => {
    expect(splitReducer(initialState, { type: 'OTHER_ACTION' })).toBe(initialState);
    expect(splitReducer(initialState, { type: 'OTHER_ACTION', payload: null })).toBe(initialState);
    expect(splitReducer(initialState, { type: 'OTHER_ACTION', payload: undefined })).toBe(initialState);
    expect(splitReducer(initialState, { type: 'OTHER_ACTION', payload: {} })).toBe(initialState);
    expect(splitReducer(initialState, { type: 'OTHER_ACTION', payload: true })).toBe(initialState);
  });

});
