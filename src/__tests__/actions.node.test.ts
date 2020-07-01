/** Mocks */
import { mockSdk, Event } from './utils/mockNodeSplitSdk';
jest.mock('@splitsoftware/splitio', () => {
  return { SplitFactory: mockSdk() };
});
import { SplitFactory } from '@splitsoftware/splitio';

import mockStore from './utils/mockStore';
import { STATE_INITIAL } from './utils/storeState';
import { sdkNodeConfig } from './utils/sdkConfigs';

/** Constants and types */
import { SPLIT_READY, SPLIT_TIMEDOUT, SPLIT_DESTROY, ADD_TREATMENTS, ERROR_GETT_NO_INITSPLITSDK, ERROR_DESTROY_NO_INITSPLITSDK } from '../constants';
const splitKey = 'user1';

/** Test targets */
import { initSplitSdk, getTreatments, destroySplitSdk, splitSdk } from '../asyncActions';

describe('initSplitSdk', () => {

  beforeEach(() => {
    splitSdk.factory = null;
    splitSdk.config = null;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('invokes callbacks and creates SPLIT_READY actions when SDK_READY event is triggered', (done) => {
    const onUpdateCb = jest.fn();
    const initSplitSdkAction = initSplitSdk({ config: sdkNodeConfig, onReady: onReadyCb, onUpdate: onUpdateCb });
    expect(splitSdk.config).toBe(sdkNodeConfig);
    expect(splitSdk.factory).toBeTruthy();

    const timestamp = Date.now();
    (splitSdk.factory as any).client().__emitter__.emit(Event.SDK_READY);

    function onReadyCb() {
      const store = mockStore(STATE_INITIAL);
      store.dispatch<any>(initSplitSdkAction);
      // Action is dispatched synchronously
      const action = store.getActions()[0];
      expect(action.type).toEqual(SPLIT_READY);
      expect(action.payload.timestamp).toBeLessThanOrEqual(Date.now());
      expect(action.payload.timestamp).toBeGreaterThanOrEqual(timestamp);
      expect((SplitFactory as jest.Mock).mock.calls.length).toBe(1);

      (splitSdk.factory as any).client().__emitter__.emit(Event.SDK_UPDATE);
      expect(onUpdateCb.mock.calls.length).toBe(1);

      // @TODO test that callbacks are called only once when the thunk action is dispatched in multiple stores
      done();
    }
  });

  it('invokes callbacks and creates SPLIT_TIMEDOUT and then SPLIT_READY actions when SDK_READY_TIMED_OUT and SDK_READY events are triggered', (done) => {
    const initSplitSdkAction = initSplitSdk({ config: sdkNodeConfig, onReady: onReadyCb, onTimedout: onTimedoutCb });
    let onTimeoutCbFirstTime = true;
    let onReadyCbFirstTime = true;
    let timestamp = Date.now();
    (splitSdk.factory as any).client().__emitter__.emit(Event.SDK_READY_TIMED_OUT);

    function onTimedoutCb() {
      if (!onTimeoutCbFirstTime) throw new Error('timeout callback should not be called more than once');
      onTimeoutCbFirstTime = false;

      const store = mockStore(STATE_INITIAL);
      store.dispatch<any>(initSplitSdkAction);

      const action = store.getActions()[0];
      expect(action.type).toEqual(SPLIT_TIMEDOUT);
      expect(action.payload.timestamp).toBeLessThanOrEqual(Date.now());
      expect(action.payload.timestamp).toBeGreaterThanOrEqual(timestamp);
      expect((SplitFactory as jest.Mock).mock.calls.length).toBe(1);

      timestamp = Date.now();
      (splitSdk.factory as any).client().__emitter__.emit(Event.SDK_READY);
    }

    function onReadyCb() {
      if (!onReadyCbFirstTime) throw new Error('ready callback should not be called more than once');
      onReadyCbFirstTime = false;

      const store = mockStore(STATE_INITIAL);
      store.dispatch<any>(initSplitSdkAction);
      // Actions are dispatched synchronously
      const timeoutAction = store.getActions()[0];
      expect(timeoutAction.type).toEqual(SPLIT_TIMEDOUT);
      expect(timeoutAction.payload.timestamp).toBeLessThanOrEqual(Date.now());
      expect(timeoutAction.payload.timestamp).toBeGreaterThanOrEqual(timestamp);

      const readyAction = store.getActions()[1];
      expect(readyAction.type).toEqual(SPLIT_READY);
      expect(readyAction.payload.timestamp).toBeLessThanOrEqual(Date.now());
      expect(readyAction.payload.timestamp).toBeGreaterThanOrEqual(timestamp);

      done();
    }
  });

  // @TODO fix this test
  // it('returns a promise that rejects on SDK_READY_TIMED_OUT', async (done) => {
  //   const store = mockStore(STATE_INITIAL);
  //   try {
  //     setTimeout(() => { (splitSdk.factory as any).client().__emitter__.emit(Event.SDK_READY_TIMED_OUT, 'SDK_READY_TIMED_OUT'); }, 100);
  //     await store.dispatch<any>(initSplitSdk({ config: sdkNodeConfig }));
  //   } catch (error) {
  //     expect(error.includes('SDK_READY_TIMED_OUT'));
  //     done();
  //   } finally {
  //     console.log('sapee');
  //   }
  // });

});

describe('getTreatments', () => {

  beforeEach(() => {
    splitSdk.factory = null;
    splitSdk.config = null;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('dispatch a no-op async action if Split SDK was not initialized and logs error', () => {
    const errorSpy = jest.spyOn(console, 'error');
    const store = mockStore(STATE_INITIAL);

    store.dispatch<any>(getTreatments({ key: splitKey, splitNames: 'split1' }));

    expect(errorSpy).toBeCalledWith(ERROR_GETT_NO_INITSPLITSDK);
    expect(store.getActions().length).toBe(0);
  });

  it('dispatch an ADD_TREATMENTS action if Split SDK is ready', (done) => {

    // Init SDK and set ready
    const initSplitSdkAction = initSplitSdk({ config: sdkNodeConfig, onReady: onReadyCb });
    (splitSdk.factory as any).client().__emitter__.emit(Event.SDK_READY);

    function onReadyCb() {
      const store = mockStore(STATE_INITIAL);
      store.dispatch<any>(initSplitSdkAction);

      // Invoke with a Split name string and no attributes
      store.dispatch<any>(getTreatments({ key: splitKey, splitNames: 'split1' }));

      let action = store.getActions()[1];
      expect(action.type).toBe(ADD_TREATMENTS);
      expect(action.payload.key).toBe(splitKey);
      expect((splitSdk.factory as any).client().getTreatmentsWithConfig).toHaveBeenLastCalledWith(splitKey, ['split1'], undefined);
      expect((splitSdk.factory as any).client().getTreatmentsWithConfig).toHaveLastReturnedWith(action.payload.treatments);

      // Invoke with a list of Split names and a attributes object
      const splitNames = ['split1', 'split2'];
      const attributes = { att1: 'att1' };
      store.dispatch<any>(getTreatments({ key: splitKey, splitNames, attributes }));

      action = store.getActions()[2];
      expect(action.type).toBe(ADD_TREATMENTS);
      expect(action.payload.key).toBe(splitKey);
      expect((splitSdk.factory as any).client().getTreatmentsWithConfig).toHaveBeenLastCalledWith(splitKey, splitNames, attributes);
      expect((splitSdk.factory as any).client().getTreatmentsWithConfig).toHaveLastReturnedWith(action.payload.treatments);

      done();
    }
  });

});

describe('destroySplitSdk', () => {

  beforeEach(() => {
    splitSdk.factory = null;
    splitSdk.config = null;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('logs error and dispatches a no-op async action that returns a resolved promise if Split SDK was not initialized', () => {
    const errorSpy = jest.spyOn(console, 'error');
    const store = mockStore(STATE_INITIAL);

    store.dispatch<any>(destroySplitSdk()).then(() => {
      expect(errorSpy).toBeCalledWith(ERROR_DESTROY_NO_INITSPLITSDK);
      expect(store.getActions().length).toBe(0);
    });
  });

  // @TODO refactor the following test

  // it('returns a promise and dispatch SPLIT_DESTROY actions when clients are destroyed', (done) => {
  //   const store = mockStore(STATE_INITIAL);
  //   const actionResult = store.dispatch<any>(initSplitSdk({ config: sdkNodeConfig }));
  //   (splitSdk.factory as any).client().__emitter__.emit(Event.SDK_READY);

  //   actionResult.then(() => {
  //     // we dispatch some `getTreatments` with different user keys
  //     store.dispatch<any>(getTreatments({ splitNames: 'split2', key: 'other-user-key' }));
  //     store.dispatch<any>(getTreatments({ splitNames: 'split3', key: 'other-user-key-2' }));

  //     const timestamp = Date.now();
  //     const actionResult = store.dispatch<any>(destroySplitSdk());

  //     actionResult.then(() => {
  //       const action = store.getActions()[3];
  //       expect(action.type).toEqual(SPLIT_DESTROY);
  //       expect(action.payload.timestamp).toBeLessThanOrEqual(Date.now());
  //       expect(action.payload.timestamp).toBeGreaterThanOrEqual(timestamp);
  //       // assert that the client destroy method was called
  //       expect((splitSdk.factory as any).client().destroy.mock.calls.length).toBe(1);
  //       done();
  //     }, 0);
  //   });
  // });

});
