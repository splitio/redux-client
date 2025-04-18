/** Mocks */
import { mockSdk, Event } from './utils/mockBrowserSplitSdk';
jest.mock('@splitsoftware/splitio', () => {
  return { SplitFactory: mockSdk() };
});
import { SplitFactory } from '@splitsoftware/splitio';

import mockStore from './utils/mockStore';
import { STATE_INITIAL } from './utils/storeState';
import { sdkBrowserConfig } from './utils/sdkConfigs';

/** Constants and types */
import {
  SPLIT_READY, SPLIT_READY_WITH_EVALUATIONS, SPLIT_READY_FROM_CACHE, SPLIT_READY_FROM_CACHE_WITH_EVALUATIONS,
  SPLIT_UPDATE, SPLIT_UPDATE_WITH_EVALUATIONS, SPLIT_TIMEDOUT, SPLIT_DESTROY, ADD_TREATMENTS,
  ERROR_GETT_NO_INITSPLITSDK, ERROR_DESTROY_NO_INITSPLITSDK, ERROR_GETT_NO_PARAM_OBJECT,
} from '../constants';

/** Test targets */
import { initSplitSdk, getTreatments, destroySplitSdk, splitSdk, getClient } from '../asyncActions';

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

  it('invokes callbacks and dispatches SPLIT_READY and SPLIT_UPDATE actions when SDK_READY and SDK_UPDATE events are triggered', (done) => {
    const store = mockStore(STATE_INITIAL);
    const onReadyCb = jest.fn();
    const onUpdateCb = jest.fn();
    const actionResult = store.dispatch<any>(initSplitSdk({ config: sdkBrowserConfig, onReady: onReadyCb, onUpdate: onUpdateCb }));
    expect(splitSdk.config).toBe(sdkBrowserConfig);
    expect(splitSdk.factory).toBeTruthy();

    let timestamp = Date.now();
    (splitSdk.factory as any).client().__emitter__.emit(Event.SDK_READY);
    actionResult.then(() => {
      // return of async action
      let action = store.getActions()[0];
      expect(action).toEqual({
        type: SPLIT_READY,
        payload: {
          timestamp: expect.toBeWithinRange(timestamp, Date.now() + 1),
        }
      });
      expect((SplitFactory as jest.Mock).mock.calls.length).toBe(1);
      expect(onReadyCb.mock.calls.length).toBe(1);

      timestamp = Date.now();
      (splitSdk.factory as any).client().__emitter__.emit(Event.SDK_UPDATE);
      setTimeout(() => {
        action = store.getActions()[1];
        expect(action).toEqual({
          type: SPLIT_UPDATE,
          payload: {
            timestamp: expect.toBeWithinRange(timestamp, Date.now() + 1),
          }
        });
        expect(onUpdateCb.mock.calls.length).toBe(1);
        done();
      }, 0);
    });
  });

  it('invokes callbacks and dispatches SPLIT_TIMEDOUT and then SPLIT_READY actions when SDK_READY_TIMED_OUT and SDK_READY events are triggered', (done) => {
    const store = mockStore(STATE_INITIAL);
    const onReadyCb = jest.fn();
    const onTimedoutCb = jest.fn();
    const actionResult = store.dispatch<any>(initSplitSdk({ config: sdkBrowserConfig, onReady: onReadyCb, onTimedout: onTimedoutCb }));

    let timestamp = Date.now();
    (splitSdk.factory as any).client().__emitter__.emit(Event.SDK_READY_TIMED_OUT);
    actionResult.catch(() => {
      // return of async action
      let action = store.getActions()[0];
      expect(action).toEqual({
        type: SPLIT_TIMEDOUT,
        payload: {
          timestamp: expect.toBeWithinRange(timestamp, Date.now() + 1),
        }
      });
      expect((SplitFactory as jest.Mock).mock.calls.length).toBe(1);
      expect(onTimedoutCb.mock.calls.length).toBe(1);

      timestamp = Date.now();
      (splitSdk.factory as any).client().__emitter__.emit(Event.SDK_READY);
      setTimeout(() => {
        action = store.getActions()[1];
        expect(action).toEqual({
          type: SPLIT_READY,
          payload: {
            timestamp: expect.toBeWithinRange(timestamp, Date.now() + 1),
          }
        });
        expect(onReadyCb.mock.calls.length).toBe(1);
        done();
      }, 0);
    });
  });

  it('invokes onReadyFromCache callback and dispatches SPLIT_READY_FROM_CACHE action when SDK_READY_FROM_CACHE event is triggered', (done) => {
    const store = mockStore(STATE_INITIAL);
    const timestamp = Date.now();

    const onReadyFromCacheCb = jest.fn(() => {
      // action should be already dispatched when the callback is called
      const action = store.getActions()[0];
      expect(action).toEqual({
        type: SPLIT_READY_FROM_CACHE,
        payload: {
          timestamp: expect.toBeWithinRange(timestamp, Date.now() + 1),
        }
      });
    });
    const onReadyCb = jest.fn(() => {
      const action = store.getActions()[1];
      expect(action).toEqual({
        type: SPLIT_READY,
        payload: {
          timestamp: expect.toBeWithinRange(timestamp, Date.now() + 1),
        }
      });
    });

    const actionResult = store.dispatch<any>(initSplitSdk({ config: sdkBrowserConfig, onReady: onReadyCb, onReadyFromCache: onReadyFromCacheCb }));
    expect(splitSdk.config).toBe(sdkBrowserConfig);
    expect(splitSdk.factory).toBeTruthy();

    (splitSdk.factory as any).client().__emitter__.emit(Event.SDK_READY_FROM_CACHE);
    (splitSdk.factory as any).client().__emitter__.emit(Event.SDK_READY);

    actionResult.then(() => {
      expect((SplitFactory as jest.Mock).mock.calls.length).toBe(1);
      expect(onReadyFromCacheCb.mock.calls.length).toBe(1);
      expect(onReadyCb.mock.calls.length).toBe(1);

      done();
    });
  });

  it('returns a promise that rejects on SDK_READY_TIMED_OUT', async () => {
    const store = mockStore(STATE_INITIAL);
    try {
      setTimeout(() => { (splitSdk.factory as any).client().__emitter__.emit(Event.SDK_READY_TIMED_OUT, 'SDK_READY_TIMED_OUT'); }, 100);
      await store.dispatch<any>(initSplitSdk({ config: sdkBrowserConfig }));
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

  it('logs error and dispatches a no-op async action if Split SDK was not initialized', () => {
    const errorSpy = jest.spyOn(console, 'error');
    const store = mockStore(STATE_INITIAL);

    store.dispatch<any>(getTreatments({ splitNames: 'split1' }));

    expect(errorSpy).toBeCalledWith(ERROR_GETT_NO_INITSPLITSDK);
    expect(store.getActions().length).toBe(0);
  });

  it('logs error and dispatches a no-op async action if the provided param is invalid', async () => {
    // Init SDK and set ready
    const store = mockStore(STATE_INITIAL);
    const actionResult = store.dispatch<any>(initSplitSdk({ config: sdkBrowserConfig }));
    (splitSdk.factory as any).client().__emitter__.emit(Event.SDK_READY);
    await actionResult;

    const consoleLogSpy = jest.spyOn(console, 'log');
    store.clearActions();

    // @ts-expect-error testing invalid input
    store.dispatch<any>(getTreatments());

    expect(store.getActions().length).toBe(0);
    expect(consoleLogSpy).toBeCalledWith(ERROR_GETT_NO_PARAM_OBJECT);
    consoleLogSpy.mockRestore();
  });

  it('dispatches an ADD_TREATMENTS action if Split SDK is ready', (done) => {

    // Init SDK and set ready
    const store = mockStore(STATE_INITIAL);
    const actionResult = store.dispatch<any>(initSplitSdk({ config: sdkBrowserConfig }));
    (splitSdk.factory as any).client().__emitter__.emit(Event.SDK_READY);

    actionResult.then(() => {
      store.dispatch<any>(getTreatments({ splitNames: 'split1' }));
      store.dispatch<any>(getTreatments({ splitNames: ['split2'], key: sdkBrowserConfig.core.key }));
      store.dispatch<any>(getTreatments({ flagSets: 'set1', key: { matchingKey: sdkBrowserConfig.core.key as string, bucketingKey: 'bucket' } }));

      const actions = [store.getActions()[1], store.getActions()[2], store.getActions()[3]];
      actions.forEach(action => {
        expect(action).toEqual({
          type: ADD_TREATMENTS,
          payload: {
            key: sdkBrowserConfig.core.key,
            treatments: expect.any(Object)
          }
        });
      });

      // getting the evaluation result and validating it matches the results from SDK
      expect(splitSdk.factory.client().getTreatmentsWithConfig).toHaveBeenCalledWith(['split1'], undefined, undefined);
      expect(splitSdk.factory.client().getTreatmentsWithConfig).toHaveReturnedWith(actions[0].payload.treatments);
      expect(splitSdk.factory.client().getTreatmentsWithConfig).toHaveBeenLastCalledWith(['split2'], undefined, undefined);
      expect(splitSdk.factory.client().getTreatmentsWithConfig).toHaveLastReturnedWith(actions[1].payload.treatments);
      expect(splitSdk.factory.client().getTreatmentsWithConfigByFlagSets).toHaveBeenLastCalledWith(['set1'], undefined, undefined);
      expect(splitSdk.factory.client().getTreatmentsWithConfigByFlagSets).toHaveLastReturnedWith(actions[2].payload.treatments);

      expect(getClient(splitSdk).evalOnUpdate).toEqual({});
      expect(getClient(splitSdk).evalOnReady.length).toEqual(0);

      done();
    });
  });

  it('dispatches ADD_TREATMENTS actions if Split SDK is ready from cache, and registers them to be evaluated along with SDK ready', (done) => {

    // Init SDK and set ready from cache
    const store = mockStore(STATE_INITIAL);
    const actionResult = store.dispatch<any>(initSplitSdk({ config: sdkBrowserConfig, onReadyFromCache: onReadyFromCacheCb }));
    (splitSdk.factory as any).client().__emitter__.emit(Event.SDK_READY_FROM_CACHE);

    function onReadyFromCacheCb() {
      // dispatching multiple ADD_TREATMENTS actions
      store.dispatch<any>(getTreatments({ splitNames: 'split1', key: sdkBrowserConfig.core.key })); // single feature flag name
      const attributes = { att1: 'att1' };
      store.dispatch<any>(getTreatments({ splitNames: ['split2', 'split3'], attributes })); // list of feature flag names with attributes

      // getting the 1st evaluation result and validating it matches the results from SDK
      let action = store.getActions()[1]; // action 0 is SPLIT_READY_FROM_CACHE
      expect(action).toEqual({
        type: ADD_TREATMENTS,
        payload: {
          key: sdkBrowserConfig.core.key,
          treatments: expect.any(Object)
        }
      });
      expect(splitSdk.factory.client().getTreatmentsWithConfig).toHaveBeenNthCalledWith(1, ['split1'], undefined, undefined);
      expect(splitSdk.factory.client().getTreatmentsWithConfig).toHaveNthReturnedWith(1, action.payload.treatments);

      // getting the 2nd evaluation result and validating it matches the results from SDK
      action = store.getActions()[2];
      expect(action).toEqual({
        type: ADD_TREATMENTS,
        payload: {
          key: sdkBrowserConfig.core.key,
          treatments: expect.any(Object)
        }
      });
      expect(splitSdk.factory.client().getTreatmentsWithConfig).toHaveBeenNthCalledWith(2, ['split2', 'split3'], attributes, undefined);
      expect(splitSdk.factory.client().getTreatmentsWithConfig).toHaveNthReturnedWith(2, action.payload.treatments);
      expect(getClient(splitSdk).evalOnUpdate).toEqual({}); // control assertion - cbs scheduled for update
      expect(getClient(splitSdk).evalOnReady.length).toEqual(2); // control assertion - cbs scheduled for ready

      (splitSdk.factory as any).client().__emitter__.emit(Event.SDK_READY);

      actionResult.then(() => {
        // The SPLIT_READY_WITH_EVALUATIONS action is dispatched if the SDK is ready and there are pending evaluations.
        action = store.getActions()[3];
        expect(action).toEqual({
          type: SPLIT_READY_WITH_EVALUATIONS,
          payload: {
            key: sdkBrowserConfig.core.key,
            treatments: expect.any(Object),
            timestamp: expect.any(Number),
            nonDefaultKey: false
          }
        });

        // Multiple evaluations where registered, but only one SPLIT_READY_WITH_EVALUATIONS action is dispatched
        expect(store.getActions().length).toBe(4);

        // getting the evaluation result and validating it matches the results from SDK calls
        expect(splitSdk.factory.client().getTreatmentsWithConfig).toHaveBeenNthCalledWith(3, ['split1'], undefined, undefined);
        expect(splitSdk.factory.client().getTreatmentsWithConfig).toHaveBeenNthCalledWith(4, ['split2', 'split3'], attributes, undefined);
        const expectedTreatments = {
          ...(splitSdk.factory.client().getTreatmentsWithConfig as jest.Mock).mock.results[2].value,
          ...(splitSdk.factory.client().getTreatmentsWithConfig as jest.Mock).mock.results[3].value,
        };
        expect(action.payload.treatments).toEqual(expectedTreatments);

        expect(splitSdk.factory.client().getTreatmentsWithConfig).toBeCalledTimes(4); // control assertion - getTreatmentsWithConfig calls
        expect(getClient(splitSdk).evalOnUpdate).toEqual({}); // control assertion - cbs scheduled for update

        // The first ADD_TREATMENTS actions is dispatched again, but this time is registered for 'evalOnUpdate'
        store.dispatch<any>(getTreatments({ splitNames: 'split1', evalOnUpdate: true }));
        // Dispatch another ADD_TREATMENTS action with flag sets
        store.dispatch<any>(getTreatments({ flagSets: 'set1', evalOnUpdate: true }));

        // Validate action and registered callback
        expect(splitSdk.factory.client().getTreatmentsWithConfig).toBeCalledTimes(5);
        expect(splitSdk.factory.client().getTreatmentsWithConfigByFlagSets).toBeCalledTimes(1);
        expect(getClient(splitSdk).evalOnUpdate).toEqual({
          'flag::split1': { evalOnUpdate: true, flagSets: undefined, splitNames: ['split1'] },
          'set::set1': { evalOnUpdate: true, flagSets: ['set1'], splitNames: undefined }
        });

        done();
      });
    }
  });

  it('registers evaluations if Split SDK is not operational, to dispatch it when ready (Using action result promise)', (done) => {

    const store = mockStore(STATE_INITIAL);
    const actionResult = store.dispatch<any>(initSplitSdk({ config: sdkBrowserConfig, onReadyFromCache: onReadyFromCacheCb }));
    store.dispatch<any>(getTreatments({ splitNames: 'split2' })); // `evalOnUpdate` and `evalOnReadyFromCache` params are false by default
    store.dispatch<any>(getTreatments({ flagSets: 'set2' }));

    // If SDK is not operational, ADD_TREATMENTS actions are dispatched, with control treatments for provided feature flag names, and no treatments for provided flag sets.

    expect(store.getActions().length).toBe(0);
    // SDK client is not called, but items are added to 'evalOnReady' list.
    expect(splitSdk.factory.client().getTreatmentsWithConfig).toBeCalledTimes(0);
    expect(splitSdk.factory.client().getTreatmentsWithConfigByFlagSets).toBeCalledTimes(0);
    expect(getClient(splitSdk).evalOnReady.length).toEqual(2);
    expect(getClient(splitSdk).evalOnUpdate).toEqual({});

    // When the SDK is ready from cache, the SPLIT_READY_FROM_CACHE_WITH_EVALUATIONS action is not dispatched if the `getTreatments` action was dispatched with `evalOnReadyFromCache` false
    (splitSdk.factory as any).client().__emitter__.emit(Event.SDK_READY_FROM_CACHE);
    function onReadyFromCacheCb() {
      expect(store.getActions().length).toBe(1);
      const action = store.getActions()[0];
      expect(action).toEqual({
        type: SPLIT_READY_FROM_CACHE,
        payload: {
          timestamp: expect.any(Number)
        }
      });
    }

    (splitSdk.factory as any).client().__emitter__.emit(Event.SDK_READY);

    actionResult.then(() => {
      // The SPLIT_READY_WITH_EVALUATIONS action is dispatched if the SDK is ready and there are pending evaluations.
      const action = store.getActions()[1];
      expect(action).toEqual({
        type: SPLIT_READY_WITH_EVALUATIONS,
        payload: {
          key: sdkBrowserConfig.core.key,
          treatments: expect.any(Object),
          timestamp: expect.any(Number),
          nonDefaultKey: false
        }
      });

      // getting the evaluation result and validating it matches the results from SDK
      const treatments = action.payload.treatments;
      expect(splitSdk.factory.client().getTreatmentsWithConfig).toBeCalledWith(['split2'], undefined, undefined);
      expect(splitSdk.factory.client().getTreatmentsWithConfigByFlagSets).toBeCalledWith(['set2'], undefined, undefined);
      expect(treatments).toEqual({
        ...(splitSdk.factory.client().getTreatmentsWithConfig as jest.Mock).mock.results[0].value,
        ...(splitSdk.factory.client().getTreatmentsWithConfigByFlagSets as jest.Mock).mock.results[0].value,
      })

      expect(getClient(splitSdk).evalOnUpdate).toEqual({}); // control assertion - cbs scheduled for update

      // The ADD_TREATMENTS actions is dispatched again, but this time is registered for 'evalOnUpdate'
      store.dispatch<any>(getTreatments({ splitNames: 'split2', evalOnUpdate: true }));

      // Validate action and registered callback
      expect(splitSdk.factory.client().getTreatmentsWithConfig).toBeCalledTimes(2);
      expect(Object.values(getClient(splitSdk).evalOnUpdate).length).toBe(1);

      done();
    });
  });

  it('registers pending evaluations if Split SDK is not operational, to dispatch it when ready from cache, ready, and updated (Using callbacks to assert that registered evaluations are not affected when SDK timeout)', (done) => {

    const store = mockStore(STATE_INITIAL);
    store.dispatch<any>(initSplitSdk({ config: sdkBrowserConfig, onTimedout: onTimedoutCb, onReadyFromCache: onReadyFromCacheCb, onReady: onReadyCb }));

    const attributes = { att1: 'att1' };
    const properties = { prop1: 'prop1' };
    store.dispatch<any>(getTreatments({ splitNames: 'split3', attributes, properties, evalOnUpdate: true, evalOnReadyFromCache: true }));

    // If SDK is not ready, an ADD_TREATMENTS action is dispatched with control treatments without calling SDK client
    expect(store.getActions().length).toBe(0);
    expect(splitSdk.factory.client().getTreatmentsWithConfig).toBeCalledTimes(0);

    // the item is added for evaluation on SDK_READY, and also on SDK_READY_FROM_CACHE and SDK_UPDATE events
    // because of `evalOnReadyFromCache` and `evalOnUpdate` params in `getTreatments` action creator.
    expect(getClient(splitSdk).evalOnReady.length).toEqual(1);
    expect(getClient(splitSdk).evalOnReadyFromCache.length).toEqual(1);
    expect(Object.values(getClient(splitSdk).evalOnUpdate).length).toBe(1);

    // When the SDK has timedout, the SPLIT_TIMEDOUT action is dispatched. It doesn't affect registered evaluations for other SDK events.
    (splitSdk.factory as any).client().__emitter__.emit(Event.SDK_READY_TIMED_OUT);
    function onTimedoutCb() {
      const action = store.getActions()[0];
      expect(action).toEqual({
        type: SPLIT_TIMEDOUT,
        payload: {
          timestamp: expect.any(Number)
        }
      });
    }

    // When the SDK is ready from cache, the SPLIT_READY_FROM_CACHE_WITH_EVALUATIONS action is dispatched instead of
    // SPLIT_READY_FROM_CACHE, because of the `evalOnReadyFromCache` param in `getTreatments` action
    (splitSdk.factory as any).client().__emitter__.emit(Event.SDK_READY_FROM_CACHE);
    function onReadyFromCacheCb() {
      const action = store.getActions()[1];
      expect(action).toEqual({
        type: SPLIT_READY_FROM_CACHE_WITH_EVALUATIONS,
        payload: {
          key: sdkBrowserConfig.core.key,
          treatments: expect.any(Object),
          timestamp: expect.any(Number),
          nonDefaultKey: false
        }
      });

      // getting the evaluation result and validating it matches the results from SDK
      const treatments = action.payload.treatments;
      expect(splitSdk.factory.client().getTreatmentsWithConfig).lastCalledWith(['split3'], attributes, { properties });
      expect(splitSdk.factory.client().getTreatmentsWithConfig).toHaveLastReturnedWith(treatments);
    }

    (splitSdk.factory as any).client().__emitter__.emit(Event.SDK_READY);

    // Using cb for ready event, because action result is rejected due to SDK timeout
    function onReadyCb() {
      // The SPLIT_READY_WITH_EVALUATIONS action is dispatched if the SDK is ready and there are pending evaluations.
      let action = store.getActions()[2];
      expect(action).toEqual({
        type: SPLIT_READY_WITH_EVALUATIONS,
        payload: {
          key: sdkBrowserConfig.core.key,
          treatments: expect.any(Object),
          timestamp: expect.any(Number),
          nonDefaultKey: false
        }
      });

      // getting the evaluation result and validating it matches the results from SDK
      let treatments = action.payload.treatments;
      expect(splitSdk.factory.client().getTreatmentsWithConfig).lastCalledWith(['split3'], attributes, { properties });
      expect(splitSdk.factory.client().getTreatmentsWithConfig).toHaveLastReturnedWith(treatments);

      expect(Object.values(getClient(splitSdk).evalOnUpdate).length).toBe(1); // control assertion - We should have an item to evaluate on update

      // Triggering an update dispatches SPLIT_UPDATE_WITH_EVALUATIONS
      (splitSdk.factory as any).client().__emitter__.emit(Event.SDK_UPDATE);
      action = store.getActions()[3];
      expect(action).toEqual({
        type: SPLIT_UPDATE_WITH_EVALUATIONS,
        payload: {
          key: sdkBrowserConfig.core.key,
          treatments: expect.any(Object),
          timestamp: expect.any(Number),
          nonDefaultKey: false
        }
      });

      // getting the evaluation result and validating it matches the results from SDK
      treatments = action.payload.treatments;
      expect(splitSdk.factory.client().getTreatmentsWithConfig).lastCalledWith(['split3'], attributes, { properties });
      expect(splitSdk.factory.client().getTreatmentsWithConfig).toHaveLastReturnedWith(treatments);

      expect(Object.values(getClient(splitSdk).evalOnUpdate).length).toBe(1); // control assertion - still have one evalOnUpdate subscription

      // We deregister the item from evalOnUpdate.
      store.dispatch<any>(getTreatments({ splitNames: 'split3', evalOnUpdate: false, key: { matchingKey: sdkBrowserConfig.core.key as string, bucketingKey: 'bucket' } }));
      action = store.getActions()[4];
      expect(action).toEqual({
        type: ADD_TREATMENTS,
        payload: {
          key: sdkBrowserConfig.core.key,
          treatments: expect.any(Object)
        }
      });
      expect(Object.values(getClient(splitSdk).evalOnUpdate).length).toBe(0); // control assertion - removed evalOnUpdate subscription

      // Now, SDK_UPDATE events do not trigger SPLIT_UPDATE_WITH_EVALUATIONS but SPLIT_UPDATE instead
      (splitSdk.factory as any).client().__emitter__.emit(Event.SDK_UPDATE);
      action = store.getActions()[5];
      expect(action).toEqual({
        type: SPLIT_UPDATE,
        payload: {
          timestamp: expect.any(Number)
        }
      });

      expect(store.getActions().length).toBe(6); // control assertion - no more actions after the update.
      expect(splitSdk.factory.client().getTreatmentsWithConfig).toBeCalledTimes(4); // control assertion - called 4 times, in actions SPLIT_READY_FROM_CACHE_WITH_EVALUATIONS, SPLIT_READY_WITH_EVALUATIONS, SPLIT_UPDATE_WITH_EVALUATIONS and ADD_TREATMENTS.

      done();
    }
  });

  it('for non-default clients, registers pending evaluations if the client is not operational, to dispatch it when ready from cache, ready, and updated (Using callbacks to assert that registered evaluations are not affected when the client timeouts)', (done) => {

    // Init SDK and set ready
    const store = mockStore(STATE_INITIAL);
    const actionResult = store.dispatch<any>(initSplitSdk({ config: sdkBrowserConfig }));
    (splitSdk.factory as any).client().__emitter__.emit(Event.SDK_READY_FROM_CACHE);
    (splitSdk.factory as any).client().__emitter__.emit(Event.SDK_READY);

    actionResult.then(() => {
      // SDK_READY_FROM_CACHE & SPLIT_READY should have been dispatched
      expect(store.getActions()).toEqual([{
        type: SPLIT_READY_FROM_CACHE, payload: { timestamp: expect.any(Number) }
      }, {
        type: SPLIT_READY, payload: { timestamp: expect.any(Number) }
      }]);

      // If getTreatment is dispatched for a different user key, the item is added to the 'evalOnReady' list of the new client
      store.dispatch<any>(getTreatments({ splitNames: 'split2', key: 'other-user-key' }));
      expect(getClient(splitSdk).evalOnReady.length).toEqual(0); // control assertion - no evaluations were registered for SDK_READY on main client
      expect(getClient(splitSdk, 'other-user-key').evalOnReady.length).toEqual(1); // control assertion - 1 evaluation was registered for SDK_READY on the new client
      expect(getClient(splitSdk).evalOnUpdate).toEqual({});

      // If SDK was ready from cache, the SPLIT_READY_FROM_CACHE_WITH_EVALUATIONS action is dispatched for the new clients, calling SDK client to evaluate from cache
      let action = store.getActions()[2];
      expect(action).toEqual({
        type: SPLIT_READY_FROM_CACHE_WITH_EVALUATIONS,
        payload: {
          key: 'other-user-key',
          timestamp: 0,
          treatments: expect.any(Object),
          nonDefaultKey: true
        }
      });

      expect(splitSdk.factory.client('other-user-key').getTreatmentsWithConfig).lastCalledWith(['split2'], undefined, undefined);
      expect(splitSdk.factory.client('other-user-key').getTreatmentsWithConfig).toHaveLastReturnedWith(action.payload.treatments);

      (splitSdk.factory as any).client('other-user-key').__emitter__.emit(Event.SDK_READY, 'other-user-key');

      // The SPLIT_READY_WITH_EVALUATIONS action is dispatched synchronously once the SDK is ready for the new user key
      action = store.getActions()[3];
      expect(action).toEqual({
        type: SPLIT_READY_WITH_EVALUATIONS,
        payload: {
          key: 'other-user-key',
          treatments: expect.any(Object),
          timestamp: expect.any(Number),
          nonDefaultKey: true
        }
      });

      // getting the evaluation result and validating it matches the results from SDK
      expect(splitSdk.factory.client('other-user-key').getTreatmentsWithConfig).lastCalledWith(['split2'], undefined, undefined);
      expect(splitSdk.factory.client('other-user-key').getTreatmentsWithConfig).toHaveLastReturnedWith(action.payload.treatments);

      expect(getClient(splitSdk).evalOnUpdate).toEqual({}); // control assertion

      // The getTreatments is dispatched again, but this time is evaluated with attributes and registered for 'evalOnUpdate'
      const attributes = { att1: 'att1' };
      const properties = { prop1: 'prop1' };
      store.dispatch<any>(getTreatments({ splitNames: 'split2', attributes, properties, key: 'other-user-key', evalOnUpdate: true }));
      action = store.getActions()[4];
      expect(action).toEqual({
        type: ADD_TREATMENTS,
        payload: {
          key: 'other-user-key',
          treatments: expect.any(Object)
        }
      });
      expect(splitSdk.factory.client('other-user-key').getTreatmentsWithConfig).lastCalledWith(['split2'], attributes, { properties });
      expect(Object.values(getClient(splitSdk, 'other-user-key').evalOnUpdate).length).toBe(1); // control assertion - added evalOnUpdate subscription

      // The SPLIT_UPDATE_WITH_EVALUATIONS action is dispatched when the SDK is updated for the new user key
      (splitSdk.factory as any).client('other-user-key').__emitter__.emit(Event.SDK_UPDATE);
      action = store.getActions()[5];
      expect(action).toEqual({
        type: SPLIT_UPDATE_WITH_EVALUATIONS,
        payload: {
          key: 'other-user-key',
          treatments: expect.any(Object),
          timestamp: expect.any(Number),
          nonDefaultKey: true
        }
      });
      expect(splitSdk.factory.client('other-user-key').getTreatmentsWithConfig).lastCalledWith(['split2'], attributes, { properties });
      expect(splitSdk.factory.client('other-user-key').getTreatmentsWithConfig).toHaveLastReturnedWith(action.payload.treatments);
      expect(Object.values(getClient(splitSdk, 'other-user-key').evalOnUpdate).length).toBe(1); // control assertion - keeping evalOnUpdate subscription

      // We deregister the item from evalOnUpdate.
      store.dispatch<any>(getTreatments({ splitNames: 'split2', key: 'other-user-key', evalOnUpdate: false }));
      action = store.getActions()[6];
      expect(action).toEqual({
        type: ADD_TREATMENTS,
        payload: {
          key: 'other-user-key',
          treatments: expect.any(Object)
        }
      });
      expect(splitSdk.factory.client('other-user-key').getTreatmentsWithConfig).lastCalledWith(['split2'], undefined, undefined);
      expect(splitSdk.factory.client('other-user-key').getTreatmentsWithConfig).toHaveLastReturnedWith(action.payload.treatments);
      expect(Object.values(getClient(splitSdk).evalOnUpdate).length).toBe(0); // control assertion - removed evalOnUpdate subscription

      // Now, SDK_UPDATE events do not trigger SPLIT_UPDATE_WITH_EVALUATIONS but SPLIT_UPDATE instead
      (splitSdk.factory as any).client('other-user-key').__emitter__.emit(Event.SDK_UPDATE);
      action = store.getActions()[7];
      expect(action).toEqual({
        type: SPLIT_UPDATE,
        payload: {
          key: 'other-user-key',
          timestamp: expect.any(Number)
        }
      });

      expect(store.getActions().length).toBe(8); // control assertion - no more actions after the update.
      expect(splitSdk.factory.client('other-user-key').getTreatmentsWithConfig).toBeCalledTimes(5); // control assertion - called 5 times, in actions SPLIT_READY_FROM_CACHE_WITH_EVALUATIONS, SPLIT_READY_WITH_EVALUATIONS, ADD_TREATMENTS, SPLIT_UPDATE_WITH_EVALUATIONS and ADD_TREATMENTS.

      done();
    });
  });

});

describe('destroySplitSdk', () => {

  beforeEach(clearSplitSdk);

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

  it('returns a promise and dispatch SPLIT_DESTROY actions when clients are destroyed', (done) => {
    const store = mockStore(STATE_INITIAL);
    const actionResult = store.dispatch<any>(initSplitSdk({ config: sdkBrowserConfig }));
    (splitSdk.factory as any).client().__emitter__.emit(Event.SDK_READY);

    actionResult.then(() => {
      // we dispatch some `getTreatments` with different user keys to create new clients
      store.dispatch<any>(getTreatments({ splitNames: 'split2', key: 'other-user-key' }));
      store.dispatch<any>(getTreatments({ splitNames: 'split3', key: 'other-user-key-2' }));

      const timestamp = Date.now();
      const actionResult = store.dispatch<any>(destroySplitSdk());

      actionResult.then(() => {
        const action = store.getActions()[1];
        expect(action).toEqual({
          type: SPLIT_DESTROY,
          payload: {
            timestamp: expect.toBeWithinRange(timestamp, Date.now() + 1),
          }
        });
        // assert that all client's destroy methods were called
        expect(splitSdk.factory.client().destroy).toBeCalledTimes(1);
        expect(splitSdk.factory.client('other-user-key').destroy).toBeCalledTimes(1);
        expect(splitSdk.factory.client('other-user-key-2').destroy).toBeCalledTimes(1);
        done();
      });
    });
  });

  it('invokes callback and dispatch SPLIT_DESTROY actions when clients are destroyed', (done) => {
    const store = mockStore(STATE_INITIAL);
    const actionResult = store.dispatch<any>(initSplitSdk({ config: sdkBrowserConfig }));
    (splitSdk.factory as any).client().__emitter__.emit(Event.SDK_READY);

    actionResult.then(() => {
      store.dispatch<any>(destroySplitSdk({ onDestroy: onDestroyCb }));

      function onDestroyCb() {
        // assert that all client's destroy methods were called
        expect(splitSdk.factory.client().destroy).toBeCalledTimes(1);

        const action = store.getActions()[1];
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
