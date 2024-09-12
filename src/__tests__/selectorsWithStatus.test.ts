/** Mocks */
import { SPLIT_1, SPLIT_2, USER_1, USER_2, STATUS_INITIAL, STATE_INITIAL, STATE_READY, STATE_READY_USER_2 } from './utils/storeState';
import { mockSdk } from './utils/mockBrowserSplitSdk';
jest.mock('@splitsoftware/splitio', () => {
  return { SplitFactory: mockSdk() };
});
import { initSplitSdk, splitSdk } from '../asyncActions';

/** Constants */
import { ON, OFF, CONTROL, ERROR_SELECTOR_NO_SPLITSTATE } from '../constants';

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

  it('in client-side, there might be more than one client with its own status', () => {
    initSplitSdk({
      config: {
        core: {
          authorizationKey: 'SDK KEY',
          key: USER_1,
        },
      }
    });

    // Main client is ready and has treatments
    expect(selectTreatmentAndStatus(STATE_READY.splitio, SPLIT_1)).toEqual({
      treatment: ON,
      ...STATUS_INITIAL, isReady: true, lastUpdate: STATE_READY.splitio.lastUpdate,
    });

    // USER_1 is the main client
    expect(selectTreatmentWithConfigAndStatus(STATE_READY.splitio, SPLIT_2, USER_1)).toEqual({
      treatment: { treatment: OFF, config: null },
      ...STATUS_INITIAL, isReady: true, lastUpdate: STATE_READY.splitio.lastUpdate,
    });

    // USER_2 client is not ready and has no treatments
    expect(selectTreatmentAndStatus(STATE_READY.splitio, SPLIT_1, USER_2)).toEqual({
      treatment: CONTROL,
      ...STATUS_INITIAL,
    });

    // USER_2 client is ready but has no treatments
    expect(selectTreatmentAndStatus(STATE_READY_USER_2.splitio, SPLIT_2, USER_2)).toEqual({
      treatment: CONTROL,
      ...STATUS_INITIAL, isReady: true, lastUpdate: STATE_READY_USER_2.splitio.status![USER_2].lastUpdate,
    });

    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('in server-side, there is a single client and so all user keys share the same status', () => {
    splitSdk.isDetached = true;

    expect(selectTreatmentAndStatus(STATE_READY.splitio, SPLIT_1)).toEqual({
      treatment: ON,
      ...STATUS_INITIAL, isReady: true, lastUpdate: STATE_READY.splitio.lastUpdate
    });

    // U
    expect(selectTreatmentAndStatus(STATE_READY.splitio, SPLIT_1, USER_2)).toEqual({
      treatment: CONTROL,
      ...STATUS_INITIAL, isReady: true, lastUpdate: STATE_READY.splitio.lastUpdate
    });

    expect(errorSpy).not.toHaveBeenCalled();
  });

});
