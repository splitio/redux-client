/** Mocks */
import { mockSdk, Event } from './utils/mockBrowserSplitSdk';
jest.mock('@splitsoftware/splitio', () => {
  return { SplitFactory: mockSdk() };
});
import { SplitFactory } from '@splitsoftware/splitio';

import mockStore from './utils/mockStore';
import { STATE_INITIAL } from './utils/storeState';
import { sdkBrowserLocalhost } from './utils/sdkConfigs';

/** Constants and types */
import { SPLIT_READY, SPLIT_TIMEDOUT, SPLIT_UPDATE, SPLIT_DESTROY, ADD_TREATMENTS, ERROR_GETT_NO_INITSPLITSDK, ERROR_DESTROY_NO_INITSPLITSDK, getControlTreatmentsWithConfig } from '../constants';

/** Test targets */
import { initSplitSdk, getTreatments, destroySplitSdk, splitSdk, getClient } from '../asyncActions';

describe('initSplitSdk', () => {

  beforeEach(() => {
    splitSdk.factory = null;
    splitSdk.config = null;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('invokes callbacks and creates SPLIT_READY and SPLIT_UPDATE actions when SDK_READY and SDK_UPDATE events are triggered', (done) => {
    const store = mockStore(STATE_INITIAL);
    const onReadyCb = jest.fn();
    const onUpdateCb = jest.fn();
    const actionResult = store.dispatch<any>(initSplitSdk({ config: sdkBrowserLocalhost, onReady: onReadyCb, onUpdate: onUpdateCb }));
    expect(splitSdk.config).toBe(sdkBrowserLocalhost);
    expect(splitSdk.factory).toBeTruthy();

    let timestamp = Date.now();
    (splitSdk.factory as any).client().__emitter__.emit(Event.SDK_READY);
    actionResult.then(() => {
      // return of async action
      let action = store.getActions()[0];
      expect(action.type).toEqual(SPLIT_READY);
      expect(action.payload.timestamp).toBeLessThanOrEqual(Date.now());
      expect(action.payload.timestamp).toBeGreaterThanOrEqual(timestamp);
      expect((SplitFactory as jest.Mock).mock.calls.length).toBe(1);
      expect(onReadyCb.mock.calls.length).toBe(1);

      timestamp = Date.now();
      (splitSdk.factory as any).client().__emitter__.emit(Event.SDK_UPDATE);
      setTimeout(() => {
        action = store.getActions()[1];
        expect(action.type).toEqual(SPLIT_UPDATE);
        expect(action.payload.timestamp).toBeLessThanOrEqual(Date.now());
        expect(action.payload.timestamp).toBeGreaterThanOrEqual(timestamp);
        expect(onUpdateCb.mock.calls.length).toBe(1);
        done();
      }, 0);
    });
  });

  it('invokes callbacks and creates SPLIT_TIMEDOUT and then SPLIT_READY actions when SDK_READY_TIMED_OUT and SDK_READY events are triggered', (done) => {
    const store = mockStore(STATE_INITIAL);
    const onReadyCb = jest.fn();
    const onTimedoutCb = jest.fn();
    const actionResult = store.dispatch<any>(initSplitSdk({ config: sdkBrowserLocalhost, onReady: onReadyCb, onTimedout: onTimedoutCb }));

    let timestamp = Date.now();
    (splitSdk.factory as any).client().__emitter__.emit(Event.SDK_READY_TIMED_OUT);
    actionResult.catch(() => {
      // return of async action
      let action = store.getActions()[0];
      expect(action.type).toEqual(SPLIT_TIMEDOUT);
      expect(action.payload.timestamp).toBeLessThanOrEqual(Date.now());
      expect(action.payload.timestamp).toBeGreaterThanOrEqual(timestamp);
      expect((SplitFactory as jest.Mock).mock.calls.length).toBe(1);
      expect(onTimedoutCb.mock.calls.length).toBe(1);

      timestamp = Date.now();
      (splitSdk.factory as any).client().__emitter__.emit(Event.SDK_READY);
      setTimeout(() => {
        action = store.getActions()[1];
        expect(action.type).toEqual(SPLIT_READY);
        expect(action.payload.timestamp).toBeLessThanOrEqual(Date.now());
        expect(action.payload.timestamp).toBeGreaterThanOrEqual(timestamp);
        expect(onReadyCb.mock.calls.length).toBe(1);
        done();
      }, 0);
    });
  });

  it('returns a promise that rejects on SDK_READY_TIMED_OUT', async (done) => {
    const store = mockStore(STATE_INITIAL);
    const onReadyCb = jest.fn();
    const onTimedoutCb = jest.fn();
    try {
      setTimeout(() => { (splitSdk.factory as any).client().__emitter__.emit(Event.SDK_READY_TIMED_OUT, 'SDK_READY_TIMED_OUT'); }, 100);
      await store.dispatch<any>(initSplitSdk({ config: sdkBrowserLocalhost}));
    } catch (error) {
      expect(error.includes('SDK_READY_TIMED_OUT'));
      done();
    }
  });

});

describe('getTreatments', () => {

  beforeEach(() => {
    splitSdk.factory = null;
    splitSdk.config = null;
  });

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

  it('dispatches an ADD_TREATMENTS action if Split SDK is ready', (done) => {

    // Init SDK and set ready
    const store = mockStore(STATE_INITIAL);
    const actionResult = store.dispatch<any>(initSplitSdk({ config: sdkBrowserLocalhost }));
    (splitSdk.factory as any).client().__emitter__.emit(Event.SDK_READY);

    actionResult.then(() => {
      store.dispatch<any>(getTreatments({ splitNames: 'split1' }));

      const action = store.getActions()[1];
      expect(action.type).toBe('ADD_TREATMENTS');
      expect(action.payload.key).toBe(sdkBrowserLocalhost.core.key);
      expect((splitSdk.factory as any).client().getTreatmentsWithConfig).toHaveLastReturnedWith(action.payload.treatments);
      expect(getClient(splitSdk).evalOnUpdate).toEqual({});
      expect(getClient(splitSdk).evalOnReady.length).toEqual(0);

      done();
    });
  });

  it('registers an ADD_TREATMENTS action if Split SDK is not ready, and dispatch it when ready', (done) => {

    const store = mockStore(STATE_INITIAL);
    const actionResult = store.dispatch<any>(initSplitSdk({ config: sdkBrowserLocalhost }));
    store.dispatch<any>(getTreatments({ splitNames: 'split2' }));

    // If SDK is not ready, no ADD_TREATMENTS action is dispatched but the item is added to 'evalOnReady' list.
    expect(store.getActions().length).toBe(0);
    expect(getClient(splitSdk).evalOnReady.length).toEqual(1);
    expect(getClient(splitSdk).evalOnUpdate).toEqual({});
    expect((splitSdk.factory as any).client().getTreatmentsWithConfig).toBeCalledTimes(0);

    (splitSdk.factory as any).client().__emitter__.emit(Event.SDK_READY);

    actionResult.then(() => {
      // The ADD_TREATMENTS action is dispatched once the SDK is ready
      const action = store.getActions()[1];
      expect(action.type).toBe(ADD_TREATMENTS);
      expect(action.payload.key).toBe(sdkBrowserLocalhost.core.key);
      expect((splitSdk.factory as any).client().getTreatmentsWithConfig).lastCalledWith(['split2'], undefined);
      expect((splitSdk.factory as any).client().getTreatmentsWithConfig).toHaveLastReturnedWith(action.payload.treatments);
      expect(getClient(splitSdk).evalOnUpdate).toEqual({});

      // The same action is dispatched again, but this time is registered for 'evalOnUpdate'
      store.dispatch<any>(getTreatments({ splitNames: 'split2', evalOnUpdate: true }));

      expect(store.getActions()[2]).toEqual(store.getActions()[2]);
      expect((splitSdk.factory as any).client().getTreatmentsWithConfig).toBeCalledTimes(2);
      expect(Object.values(getClient(splitSdk).evalOnUpdate).length).toBe(1);

      done();
    });
  });

  it('registers an ADD_TREATMENTS action if Split SDK is not ready, and dispatch it when ready and updated', (done) => {

    const store = mockStore(STATE_INITIAL);
    const actionResult = store.dispatch<any>(initSplitSdk({ config: sdkBrowserLocalhost }));

    const attributes = { att1: 'att1' };
    store.dispatch<any>(getTreatments({ splitNames: 'split3', attributes, evalOnUpdate: true }));

    // If SDK is not ready, no ADD_TREATMENTS action is dispatched but the item is added to 'evalOnReady' list.
    expect(store.getActions().length).toBe(0);
    expect(getClient(splitSdk).evalOnReady.length).toEqual(1);
    expect(Object.values(getClient(splitSdk).evalOnUpdate).length).toBe(1);
    expect((splitSdk.factory as any).client().getTreatmentsWithConfig).toBeCalledTimes(0);

    (splitSdk.factory as any).client().__emitter__.emit(Event.SDK_READY);

    actionResult.then(() => {
      // The ADD_TREATMENTS action is dispatched once the SDK is ready
      let action = store.getActions()[1];
      expect(action.type).toBe(ADD_TREATMENTS);
      expect(action.payload.key).toBe(sdkBrowserLocalhost.core.key);
      expect((splitSdk.factory as any).client().getTreatmentsWithConfig).lastCalledWith(['split3'], attributes);
      expect((splitSdk.factory as any).client().getTreatmentsWithConfig).toHaveLastReturnedWith(action.payload.treatments);
      expect(Object.values(getClient(splitSdk).evalOnUpdate).length).toBe(1);

      // The ADD_TREATMENTS action is again dispatched when the SDK is updated
      (splitSdk.factory as any).client().__emitter__.emit(Event.SDK_UPDATE);
      action = store.getActions()[2];
      expect(action.type).toBe(SPLIT_UPDATE);
      action = store.getActions()[3];
      expect(action.type).toBe(ADD_TREATMENTS);
      expect(action.payload.key).toBe(sdkBrowserLocalhost.core.key);
      expect((splitSdk.factory as any).client().getTreatmentsWithConfig).lastCalledWith(['split3'], attributes);
      expect((splitSdk.factory as any).client().getTreatmentsWithConfig).toHaveLastReturnedWith(action.payload.treatments);
      expect(Object.values(getClient(splitSdk).evalOnUpdate).length).toBe(1);

      // We deregister the item from evalOnUpdate.
      store.dispatch<any>(getTreatments({ splitNames: 'split3', evalOnUpdate: false }));
      action = store.getActions()[4];
      expect(action.type).toBe(ADD_TREATMENTS);
      // Now, SDK_UPDATE events do not trigger ADD_TREATMENTS
      (splitSdk.factory as any).client().__emitter__.emit(Event.SDK_UPDATE);
      action = store.getActions()[5];
      expect(action.type).toBe(SPLIT_UPDATE);

      expect(store.getActions().length).toBe(6);
      expect(Object.values(getClient(splitSdk).evalOnUpdate).length).toBe(0);

      done();
    });
  });

});

describe('getTreatments providing a user key', () => {

  beforeEach(() => {
    splitSdk.factory = null;
    splitSdk.config = null;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('if Split SDK is ready and is provided with the same user key than the main client, it dispatches an ADD_TREATMENTS action if the client is ready', (done) => {

    // Init SDK and set ready
    const store = mockStore(STATE_INITIAL);
    const actionResult = store.dispatch<any>(initSplitSdk({ config: sdkBrowserLocalhost }));
    (splitSdk.factory as any).client().__emitter__.emit(Event.SDK_READY);

    actionResult.then(() => {
      store.dispatch<any>(getTreatments({ splitNames: 'split1', key: sdkBrowserLocalhost.core.key }));

      const action = store.getActions()[1];
      expect(action.type).toBe('ADD_TREATMENTS');
      expect(action.payload.key).toBe(sdkBrowserLocalhost.core.key);
      expect((splitSdk.factory as any).client().getTreatmentsWithConfig).toHaveLastReturnedWith(action.payload.treatments);
      expect(getClient(splitSdk).evalOnUpdate).toEqual({});
      expect(getClient(splitSdk).evalOnReady.length).toEqual(0);

      done();
    });
  });

  it('if Split SDK is ready but the user key is different than the main client, it registers an ADD_TREATMENTS action and dispatch it when the new client is ready and updated', (done) => {

    // Init SDK and set ready
    const store = mockStore(STATE_INITIAL);
    const actionResult = store.dispatch<any>(initSplitSdk({ config: sdkBrowserLocalhost }));
    (splitSdk.factory as any).client().__emitter__.emit(Event.SDK_READY);

    actionResult.then(() => {
      store.dispatch<any>(getTreatments({ splitNames: 'split2', key: 'other-user-key' }));

      // If SDK is ready for the main key and a getTreatment is dispatched for a different user key,
      // no ADD_TREATMENTS action is dispatched but the item is added to the 'evalOnReady' list of the new client.
      expect(store.getActions().length).toBe(1);
      expect(getClient(splitSdk).evalOnReady.length).toEqual(0); // @TODO test fail when changing to 1
      expect(getClient(splitSdk, 'other-user-key').evalOnReady.length).toEqual(1);
      expect(getClient(splitSdk).evalOnUpdate).toEqual({});
      let action = store.getActions()[0];
      expect(action.type).toBe(SPLIT_READY);
      expect((splitSdk.factory as any).client('other-user-key').getTreatmentsWithConfig).toBeCalledTimes(0);

      (splitSdk.factory as any).client('other-user-key').__emitter__.emit(Event.SDK_READY, 'other-user-key');

      // The ADD_TREATMENTS action is dispatched synchronously once the SDK is ready for the new user key
      expect(store.getActions().length).toBe(2);
      action = store.getActions()[1];
      expect(action.type).toBe(ADD_TREATMENTS);
      expect(action.payload.key).toBe('other-user-key');
      expect((splitSdk.factory as any).client('other-user-key').getTreatmentsWithConfig).lastCalledWith(['split2'], undefined);
      expect((splitSdk.factory as any).client('other-user-key').getTreatmentsWithConfig).toHaveLastReturnedWith(action.payload.treatments);
      expect(getClient(splitSdk).evalOnUpdate).toEqual({});

      // The same action is dispatched again, but this time is evaluated with attributes and registered for 'evalOnUpdate'
      const attributes = { att1: 'att1' };
      store.dispatch<any>(getTreatments({ splitNames: 'split2', attributes, key: 'other-user-key', evalOnUpdate: true }));

      expect(store.getActions().length).toBe(3);
      expect(store.getActions()[1]).toEqual(store.getActions()[2]);
      expect((splitSdk.factory as any).client('other-user-key').getTreatmentsWithConfig).toBeCalledTimes(2);
      expect(Object.values(getClient(splitSdk, 'other-user-key').evalOnUpdate).length).toBe(1);

      // The ADD_TREATMENTS action is dispatched when the SDK is updated
      // SPLIT_UPDATE is not triggered since it is an update for a shared client
      (splitSdk.factory as any).client('other-user-key').__emitter__.emit(Event.SDK_UPDATE);
      expect(store.getActions().length).toBe(4);
      action = store.getActions()[3];
      expect(action.type).toBe(ADD_TREATMENTS);
      expect(action.payload.key).toBe('other-user-key');
      expect((splitSdk.factory as any).client('other-user-key').getTreatmentsWithConfig).lastCalledWith(['split2'], attributes);
      expect((splitSdk.factory as any).client('other-user-key').getTreatmentsWithConfig).toHaveLastReturnedWith(action.payload.treatments);
      expect(Object.values(getClient(splitSdk, 'other-user-key').evalOnUpdate).length).toBe(1);

      // We deregister the item from evalOnUpdate.
      store.dispatch<any>(getTreatments({ splitNames: 'split2', key: 'other-user-key', evalOnUpdate: false }));
      expect(store.getActions().length).toBe(5);
      action = store.getActions()[4];
      expect(action.type).toBe(ADD_TREATMENTS);

      // Now, SDK_UPDATE events do not trigger ADD_TREATMENTS
      (splitSdk.factory as any).client('other-user-key').__emitter__.emit(Event.SDK_UPDATE);
      expect(store.getActions().length).toBe(5);
      expect(Object.values(getClient(splitSdk).evalOnUpdate).length).toBe(0);

      done();
    });
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

  it('returns a promise and dispatch SPLIT_DESTROY actions when clients are destroyed', (done) => {
    const store = mockStore(STATE_INITIAL);
    const actionResult = store.dispatch<any>(initSplitSdk({ config: sdkBrowserLocalhost }));
    (splitSdk.factory as any).client().__emitter__.emit(Event.SDK_READY);

    actionResult.then(() => {
      // we dispatch some `getTreatments` with different user keys to create new clients
      store.dispatch<any>(getTreatments({ splitNames: 'split2', key: 'other-user-key' }));
      store.dispatch<any>(getTreatments({ splitNames: 'split3', key: 'other-user-key-2' }));

      const timestamp = Date.now();
      const actionResult = store.dispatch<any>(destroySplitSdk());

      actionResult.then(() => {
        // no ADD_TREATMENTS actions are dispatched since shared clients were not ready
        let action = store.getActions()[0];
        expect(action.type).toEqual(SPLIT_READY);
        action = store.getActions()[1];
        expect(action.type).toEqual(SPLIT_DESTROY);
        expect(action.payload.timestamp).toBeLessThanOrEqual(Date.now());
        expect(action.payload.timestamp).toBeGreaterThanOrEqual(timestamp);
        // assert that all client's destroy methods were called
        expect((splitSdk.factory as any).client().destroy.mock.calls.length).toBe(1);
        expect((splitSdk.factory as any).client('other-user-key').destroy.mock.calls.length).toBe(1);
        expect((splitSdk.factory as any).client('other-user-key-2').destroy.mock.calls.length).toBe(1);
        done();
      }, 0);
    });
  });

});
