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
import { ON, CONTROL, CONTROL_WITH_CONFIG, ERROR_SELECTOR_NO_SPLITSTATE } from '../constants';

/** Test targets */
import {
  selectTreatmentAndStatus,
  selectTreatmentWithConfigAndStatus
} from '../selectors';

describe('selectTreatmentAndStatus & selectTreatmentWithConfigAndStatus', () => {

  const errorSpy = jest.spyOn(console, 'error');

  beforeEach(() => {
    errorSpy.mockClear();
  });

  it('if Split state is invalid or SDK was not initialized, returns default treatment and initial status', () => {
    const DEFAULT_TREATMENT = { treatment: 'some_value', config: 'some_config' };

    expect(selectTreatmentWithConfigAndStatus({} as any, SPLIT_1, USER_1, DEFAULT_TREATMENT)).toEqual({
      treatment: DEFAULT_TREATMENT,
      ...STATUS_INITIAL,
    });
    expect(errorSpy).toHaveBeenCalledWith(ERROR_SELECTOR_NO_SPLITSTATE);
    errorSpy.mockClear();

    expect(selectTreatmentAndStatus(STATE_INITIAL.splitio, SPLIT_1, USER_1, 'default_value')).toEqual({
      treatment: 'default_value',
      ...STATUS_INITIAL,
    });
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('if getTreatments action was not dispatched for the provided feature flag and key, returns default treatment and client status', () => {
    const store = mockStore(STATE_INITIAL);
    store.dispatch<any>(initSplitSdk({ config: sdkBrowserConfig }));
    (splitSdk.factory as any).client().__emitter__.emit(Event.SDK_READY);

    expect(selectTreatmentAndStatus(STATE_INITIAL.splitio, SPLIT_1)).toEqual({
      treatment: CONTROL,
      // status of main client:
      ...STATUS_INITIAL, isReady: true, isOperational: true,
    });

    expect(selectTreatmentAndStatus(STATE_INITIAL.splitio, SPLIT_1, USER_1, 'some_value')).toEqual({
      treatment: 'some_value',
      // USER_1 client has not been initialized yet:
      ...STATUS_INITIAL,
    });

    store.dispatch<any>(getTreatments({ key: USER_1, splitNames: [SPLIT_2] }));
    (splitSdk.factory as any).client(USER_1).__emitter__.emit(Event.SDK_READY_FROM_CACHE);

    expect(selectTreatmentWithConfigAndStatus(STATE_INITIAL.splitio, SPLIT_2, USER_1)).toEqual({
      treatment: CONTROL_WITH_CONFIG,
      // status of shared client:
      ...STATUS_INITIAL, isReadyFromCache: true, isOperational: true,
    });

    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('happy path: returns the treatment value and status of the client', () => {
    // The following actions result in STATE_READY state:
    const store = mockStore();
    store.dispatch<any>(initSplitSdk({ config: sdkBrowserConfig }));
    (splitSdk.factory as any).client().__emitter__.emit(Event.SDK_READY);
    (splitSdk.factory as any).client(USER_1).__emitter__.emit(Event.SDK_READY_FROM_CACHE);
    store.dispatch<any>(getTreatments({ splitNames: [SPLIT_1] }));
    store.dispatch<any>(getTreatments({ key: USER_1, splitNames: [SPLIT_2] }));

    expect(selectTreatmentAndStatus(STATE_READY.splitio, SPLIT_1)).toEqual({
      treatment: ON,
      ...STATUS_INITIAL,
      isReady: true, isOperational: true,
    });

    expect(selectTreatmentWithConfigAndStatus(STATE_READY.splitio, SPLIT_2, USER_1)).toEqual({
      treatment: STATE_READY.splitio.treatments[SPLIT_2][USER_1],
      ...STATUS_INITIAL,
      isReadyFromCache: true, isOperational: true,
    });

    expect(errorSpy).not.toHaveBeenCalled();
  });

});
