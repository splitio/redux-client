import reducer from '../reducer';
import { splitReady, splitTimedout, splitUpdate, addTreatments } from '../actions';
import { ISplitState } from '../types';

const initialState = {
  isReady: false,
  isTimedout: false,
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
      lastUpdate: timedoutAction.payload.timestamp,
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

  it('should not override a treatment for an existing key and split name, if the treatment is the same', () => {
    const previousTreatment = reduxState.treatments.test_split[key];
    const newTreatments: SplitIO.TreatmentsWithConfig = {
      test_split: {
        treatment: 'on',
        config: null,
      },
    };
    const addTreatmentsAction = addTreatments(key, newTreatments);
    reduxState = reducer(reduxState, addTreatmentsAction);
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
    const previousTreatment = reduxState.treatments.test_split[key];
    const newTreatments: SplitIO.TreatmentsWithConfig = {
      test_split: {
        treatment: 'off',
        config: null,
      },
    };
    const addTreatmentsAction = addTreatments(key, newTreatments);
    reduxState = reducer(reduxState, addTreatmentsAction);
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
});
