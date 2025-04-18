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

function clearSplitSdk() {
  splitSdk.config = null;
  splitSdk.splitio = null;
  splitSdk.factory = null;
  splitSdk.sharedClients = {};
  splitSdk.isDetached = false;
  splitSdk.dispatch = null;
}

describe('initSplitSdk', () => {

  beforeEach(clearSplitSdk);

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('invokes onReady callback once and dispatches SPLIT_READY action if SDK_READY event was triggered', (done) => {
    const onUpdateCb = jest.fn();
    const initSplitSdkAction = initSplitSdk({ config: sdkNodeConfig, onReady: onReadyCb, onUpdate: onUpdateCb });
    expect(splitSdk.config).toBe(sdkNodeConfig);
    expect(splitSdk.factory).toBeTruthy();

    let onReadyCbFirstTime = true;
    const timestamp = Date.now();
    (splitSdk.factory as any).client().__emitter__.emit(Event.SDK_READY);

    function onReadyCb() {
      if (!onReadyCbFirstTime) throw new Error('timeout callback should not be called more than once');
      onReadyCbFirstTime = false;

      function createStoreAndDispatchAction() {
        const store = mockStore(STATE_INITIAL);
        store.dispatch<any>(initSplitSdkAction);

        // Action is dispatched synchronously
        const action = store.getActions()[0];
        expect(action).toEqual({
          type: SPLIT_READY,
          payload: {
            timestamp: expect.toBeWithinRange(timestamp, Date.now()),
          }
        });
      }

      // create multiple stores
      for (let i = 0; i < 3; i++) createStoreAndDispatchAction();

      // invoke onUpdate callback each time SDK_UPDATE is emitted
      (splitSdk.factory as any).client().__emitter__.emit(Event.SDK_UPDATE);
      (splitSdk.factory as any).client().__emitter__.emit(Event.SDK_UPDATE);
      expect(onUpdateCb.mock.calls.length).toBe(2);
      expect((SplitFactory as jest.Mock).mock.calls.length).toBe(1);
      done();
    }
  });

  it('invokes onReady and onTimedout callbacks once and dispatches SPLIT_TIMEDOUT and SPLIT_READY actions if SDK_READY_TIMED_OUT and SDK_READY events were triggered', (done) => {
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
      expect(action).toEqual({
        type: SPLIT_TIMEDOUT,
        payload: {
          timestamp: expect.toBeWithinRange(timestamp, Date.now() + 1)
        }
      });
      expect((SplitFactory as jest.Mock).mock.calls.length).toBe(1);

      timestamp = Date.now();
      (splitSdk.factory as any).client().__emitter__.emit(Event.SDK_READY);
    }

    function onReadyCb() {
      if (!onReadyCbFirstTime) throw new Error('ready callback should not be called more than once');
      onReadyCbFirstTime = false;

      function createStoreAndDispatchActions() {
        const store = mockStore(STATE_INITIAL);
        store.dispatch<any>(initSplitSdkAction);

        // Actions are dispatched synchronously
        const timeoutAction = store.getActions()[0];
        expect(timeoutAction).toEqual({
          type: SPLIT_TIMEDOUT,
          payload: {
            timestamp: expect.toBeWithinRange(timestamp, Date.now() + 1)
          }
        });

        const readyAction = store.getActions()[1];
        expect(readyAction).toEqual({
          type: SPLIT_READY,
          payload: {
            timestamp: expect.toBeWithinRange(timestamp, Date.now() + 1)
          }
        });
      }

      // create multiple stores
      for (let i = 0; i < 3; i++) createStoreAndDispatchActions();

      done();
    }
  });

  it('returns a promise that rejects on SDK_READY_TIMED_OUT', async () => {
    const store = mockStore(STATE_INITIAL);
    try {
      const initSplitSdkAction = initSplitSdk({ config: sdkNodeConfig });
      setTimeout(() => { (splitSdk.factory as any).client().__emitter__.emit(Event.SDK_READY_TIMED_OUT, 'SDK_READY_TIMED_OUT'); }, 100);
      await store.dispatch<any>(initSplitSdkAction);
    } catch (error) {
      expect(error).toBe('SDK_READY_TIMED_OUT');
    }
  });

});

describe('getTreatments', () => {

  beforeEach(clearSplitSdk);

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

      function createStoreAndDispatchActions() {
        const store = mockStore(STATE_INITIAL);
        store.dispatch<any>(initSplitSdkAction);

        // Invoke with a feature flag name string and no attributes
        store.dispatch<any>(getTreatments({ key: splitKey, splitNames: 'split1' }));
        store.dispatch<any>(getTreatments({ key: splitKey, flagSets: ['set1'] }));

        const actions = [store.getActions()[1], store.getActions()[2]]; // action 0 is SPLIT_READY
        actions.forEach(action => {
          expect(action).toEqual({
            type: ADD_TREATMENTS,
            payload: {
              key: splitKey,
              treatments: expect.any(Object)
            }
          });
        });
        expect(splitSdk.factory.client().getTreatmentsWithConfig).toHaveBeenLastCalledWith(splitKey, ['split1'], undefined, undefined);
        expect(splitSdk.factory.client().getTreatmentsWithConfig).toHaveLastReturnedWith(actions[0].payload.treatments);
        expect(splitSdk.factory.client().getTreatmentsWithConfigByFlagSets).toHaveBeenLastCalledWith(splitKey, ['set1'], undefined, undefined);
        expect(splitSdk.factory.client().getTreatmentsWithConfigByFlagSets).toHaveLastReturnedWith(actions[1].payload.treatments);

        // Invoke with a list of feature flag names and a attributes object
        const featureFlagNames = ['split1', 'split2'];
        const attributes = { att1: 'att1' };
        const properties = { prop1: 'prop1' };
        store.dispatch<any>(getTreatments({ key: 'other_user', splitNames: featureFlagNames, attributes, properties }));

        const action = store.getActions()[3];
        expect(action).toEqual({
          type: ADD_TREATMENTS,
          payload: {
            key: 'other_user',
            treatments: expect.any(Object)
          }
        });
        expect(splitSdk.factory.client().getTreatmentsWithConfig).toHaveBeenLastCalledWith('other_user', featureFlagNames, attributes, { properties });
        expect(splitSdk.factory.client().getTreatmentsWithConfig).toHaveLastReturnedWith(action.payload.treatments);
      }

      // create multiple stores
      for (let i = 0; i < 3; i++) createStoreAndDispatchActions();

      done();
    }
  });

});

describe('destroySplitSdk', () => {

  beforeEach(clearSplitSdk);

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('logs error and dispatches a no-op async action that returns a resolved promise if Split SDK was not initialized', () => {
    const errorSpy = jest.spyOn(console, 'error');

    destroySplitSdk();
    expect(errorSpy).toBeCalledWith(ERROR_DESTROY_NO_INITSPLITSDK);
  });

  it('shuts down de SDK and invokes onDestroy callback', (done) => {
    const initSplitSdkAction = initSplitSdk({ config: sdkNodeConfig });
    (splitSdk.factory as any).client().__emitter__.emit(Event.SDK_READY);

    const store = mockStore(STATE_INITIAL);
    const actionResult = store.dispatch<any>(initSplitSdkAction);

    actionResult.then(() => {
      // we dispatch some `getTreatments` with different user keys
      store.dispatch<any>(getTreatments({ splitNames: 'split2', key: 'other-user-key' }));
      store.dispatch<any>(getTreatments({ splitNames: 'split3', key: 'other-user-key-2' }));

      destroySplitSdk({ onDestroy: onDestroyCb });

      function onDestroyCb() {
        // assert that the client destroy method was called
        expect(splitSdk.factory.client().destroy).toBeCalledTimes(1);

        // the store created before destroy has 3 actions: SPLIT_READY and ADD_TREATMENTS x 2
        expect(store.getActions().length).toEqual(3);

        // new store created after destroy has 2 actions: SPLIT_READY and SPLIT_DESTROY
        const newStoreAfterDestroy = mockStore(STATE_INITIAL);
        newStoreAfterDestroy.dispatch<any>(initSplitSdkAction);

        let action = newStoreAfterDestroy.getActions()[0];
        expect(action).toEqual({
          type: SPLIT_READY,
          payload: {
            timestamp: expect.any(Number),
          }
        });
        action = newStoreAfterDestroy.getActions()[1];
        expect(action).toEqual({
          type: SPLIT_DESTROY,
          payload: {
            timestamp: expect.any(Number),
          }
        });

        done();
      }
    });
  });

});
