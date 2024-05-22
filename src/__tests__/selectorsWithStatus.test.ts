/** Mocks */
import { SPLIT_1, SPLIT_2, STATE_READY, USER_1 } from './utils/storeState';
import { mockSdk, Event } from './utils/mockBrowserSplitSdk';
jest.mock('@splitsoftware/splitio', () => {
  return { SplitFactory: mockSdk() };
});

import mockStore from './utils/mockStore';
import { STATE_INITIAL, STATUS_INITIAL } from './utils/storeState';
import { sdkBrowserConfig } from './utils/sdkConfigs';
import { initSplitSdk, getTreatments, splitSdk } from '../asyncActions';

/** Constants */
import { ON, CONTROL, CONTROL_WITH_CONFIG, ERROR_SELECTOR_NO_SPLITSTATE, ERROR_SELECTOR_NO_INITSPLITSDK } from '../constants';

/** Test targets */
import {
  selectSplitTreatment,
  selectSplitTreatmentWithConfig
} from '../selectors';

describe('selectSplitTreatment & selectSplitTreatmentWithConfig', () => {

  const logSpy = jest.spyOn(console, 'log');

  beforeEach(() => {
    logSpy.mockClear();
  });

  it('if Split SDK was not initialized, logs error and returns default treatment and initial status', () => {
    const DEFAULT_TREATMENT = { treatment: 'some_value', config: 'some_config' };

    expect(selectSplitTreatmentWithConfig({} as any, SPLIT_1, USER_1, DEFAULT_TREATMENT)).toEqual({
      treatment: DEFAULT_TREATMENT,
      ...STATUS_INITIAL,
    });
    expect(logSpy).toHaveBeenCalledWith(ERROR_SELECTOR_NO_SPLITSTATE);

    expect(selectSplitTreatment(STATE_INITIAL.splitio, SPLIT_1, USER_1, 'default_value')).toEqual({
      treatment: 'default_value',
      ...STATUS_INITIAL,
    });
    expect(logSpy).toHaveBeenLastCalledWith(ERROR_SELECTOR_NO_INITSPLITSDK);
  });

  it('if getTreatments action was not dispatched for the provided feature flag and key, logs error and returns default treatment and client status', () => {
    const store = mockStore(STATE_INITIAL);
    store.dispatch<any>(initSplitSdk({ config: sdkBrowserConfig }));
    (splitSdk.factory as any).client().__emitter__.emit(Event.SDK_READY);

    expect(selectSplitTreatment(STATE_INITIAL.splitio, SPLIT_1)).toEqual({
      treatment: CONTROL,
      // status of main client:
      ...STATUS_INITIAL, isReady: true, isOperational: true,
    });
    expect(logSpy).toHaveBeenLastCalledWith('[ERROR] Treatment not found by selector. Check you have dispatched a "getTreatments" action for the feature flag "split_1" ');

    expect(selectSplitTreatment(STATE_INITIAL.splitio, SPLIT_1, USER_1, 'some_value')).toEqual({
      treatment: 'some_value',
      // USER_1 client has not been initialized yet:
      ...STATUS_INITIAL,
    });
    expect(logSpy).toHaveBeenLastCalledWith('[ERROR] Treatment not found by selector. Check you have dispatched a "getTreatments" action for the feature flag "split_1" and key "user_1"');

    store.dispatch<any>(getTreatments({ key: USER_1, splitNames: [SPLIT_2] }));
    (splitSdk.factory as any).client(USER_1).__emitter__.emit(Event.SDK_READY_FROM_CACHE);

    expect(selectSplitTreatmentWithConfig(STATE_INITIAL.splitio, SPLIT_2, USER_1)).toEqual({
      treatment: CONTROL_WITH_CONFIG,
      // status of shared client:
      ...STATUS_INITIAL, isReadyFromCache: true, isOperational: true,
    });
    expect(logSpy).toHaveBeenLastCalledWith('[ERROR] Treatment not found by selector. Check you have dispatched a "getTreatments" action for the feature flag "split_2" and key "user_1"');
  });

  it('happy path: returns the treatment value and status of the client', async () => {
    // The following actions result in STATE_READY state:
    const store = mockStore();
    store.dispatch<any>(initSplitSdk({ config: sdkBrowserConfig }));
    (splitSdk.factory as any).client().__emitter__.emit(Event.SDK_READY);
    (splitSdk.factory as any).client(USER_1).__emitter__.emit(Event.SDK_READY_FROM_CACHE);
    store.dispatch<any>(getTreatments({ splitNames: [SPLIT_1] }));
    store.dispatch<any>(getTreatments({ key: USER_1, splitNames: [SPLIT_2] }));

    expect(selectSplitTreatment(STATE_READY.splitio, SPLIT_1)).toEqual({
      treatment: ON,
      ...STATUS_INITIAL, isReady: true, isOperational: true,
      lastUpdate: STATE_READY.splitio.lastUpdate,
    });

    expect(selectSplitTreatmentWithConfig(STATE_READY.splitio, SPLIT_2, USER_1)).toEqual({
      treatment: STATE_READY.splitio.treatments[SPLIT_2][USER_1],
      ...STATUS_INITIAL, isReadyFromCache: true, isOperational: true,
      lastUpdate: STATE_READY.splitio.lastUpdate,
    });

    expect(logSpy).not.toHaveBeenCalled();
  });

});
