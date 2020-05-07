import reducer from '../reducer';
import { splitReady, splitTimedout, splitUpdate, addTreatments, splitDestroy } from '../actions';
import { ISplitState } from '../types';

const initialState = {
  isReady: false,
  isTimedout: false,
  hasTimedout: false,
  isDestroyed: false,
  lastUpdate: 0,
  treatments: {},
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

  let reduxState: ISplitState;
  const key = 'userkey';

  it('should handle ADD_TREATMENTS', () => {
    const treatments: SplitIO.TreatmentsWithConfig = {
      test_split: {
        treatment: 'on',
        config: null,
      },
    };
    const addTreatmentsAction = addTreatments(key, treatments);
    reduxState = reducer(initialState, addTreatmentsAction);
    expect(
      reduxState,
    ).toEqual({
      ...initialState,
      treatments: {
        test_split: {
          [key]: treatments.test_split,
        },
      },
    });
  });

  it('should not update state and override a treatment for an existing key and split name, if the treatment is the same', () => {
    const previousTreatment = reduxState.treatments.test_split[key];
    const newTreatments: SplitIO.TreatmentsWithConfig = {
      test_split: {
        treatment: 'on',
        config: null,
      },
    };
    const addTreatmentsAction = addTreatments(key, newTreatments);
    const newReduxState = reducer(reduxState, addTreatmentsAction);
    expect(newReduxState.treatments.test_split[key]).toBe(previousTreatment);
    expect(newReduxState).toBe(reduxState);
  });

  it('should override a treatment for an existing key and split name, if the treatment is different', () => {
    const previousTreatment = reduxState.treatments.test_split[key];
    const newTreatments: SplitIO.TreatmentsWithConfig = {
      test_split: {
        treatment: 'off',
        config: null,
      },
    };
    const addTreatmentsAction = addTreatments(key, newTreatments);
    const newReduxState = reducer(reduxState, addTreatmentsAction);
    expect(newReduxState.treatments.test_split[key]).not.toBe(previousTreatment);
    expect(
      newReduxState,
    ).toEqual({
      ...initialState,
      treatments: {
        test_split: {
          [key]: newTreatments.test_split,
        },
      },
    });
  });
});
