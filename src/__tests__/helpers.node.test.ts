/** Mocks */
import { mockSdk, Event } from './utils/mockNodeSplitSdk';
jest.mock('@splitsoftware/splitio', () => {
  return { SplitFactory: mockSdk() };
});

/** Constants, types, utils */
import { sdkNodeConfig } from './utils/sdkConfigs';
import { STATUS_INITIAL } from './utils/storeState';
import {
  initSplitSdk,
  splitSdk,
} from '../asyncActions';
import { ERROR_TRACK_NO_INITSPLITSDK } from '../constants';

/** Test targets */
import {
  getSplitNames,
  getSplit,
  getSplits,
  track,
  getStatus,
} from '../helpers';

const featureFlagNames: string[] = ['split_1', 'split_2'];
const featureFlagViews: SplitIO.SplitViews = [
  {
    name: 'split_1',
    trafficType: 'user',
    killed: false,
    treatments: ['on', 'off'],
    changeNumber: 0,
    configs: { on: null, off: null },
    sets: [],
    defaultTreatment: 'off',
  }, {
    name: 'split_2',
    trafficType: 'user',
    killed: false,
    treatments: ['on', 'off'],
    changeNumber: 0,
    configs: { on: null, off: null },
    sets: [],
    defaultTreatment: 'off',
  },
];

describe('getSplitNames', () => {

  beforeEach(() => {
    splitSdk.factory = null;
    splitSdk.config = null;
  });

  it('should return an empty array if the SDK was not initialized', () => {
    expect(getSplitNames()).toHaveLength(0);
  });

  it('should return an array with feature flag names and invoke the `names` method from manager', () => {
    initSplitSdk({ config: sdkNodeConfig });
    (splitSdk.factory as any).__names__.mockReturnValue(featureFlagNames);

    expect(getSplitNames()).toHaveLength(featureFlagNames.length);
    expect((splitSdk.factory as any).manager.mock.calls.length).toBe(1);
    expect((splitSdk.factory as any).__names__.mock.calls.length).toBe(1);
  });

});

describe('getSplit', () => {

  beforeEach(() => {
    splitSdk.factory = null;
    splitSdk.config = null;
  });

  it('should return null if the SDK was not initialized', () => {
    expect(getSplit('split_1')).toBe(null);
  });

  it('should return a SplitView and invoke the `split` method from manager', () => {
    initSplitSdk({ config: sdkNodeConfig });
    (splitSdk.factory as any).__split__.mockReturnValue(featureFlagViews[0]);

    expect(getSplit('split_1')).toBe(featureFlagViews[0]);
    expect((splitSdk.factory as any).manager.mock.calls.length).toBe(1);
    expect((splitSdk.factory as any).__split__.mock.calls.length).toBe(1);
    expect((splitSdk.factory as any).__split__.mock.calls[0][0]).toBe('split_1');
  });

});

describe('getSplits', () => {

  beforeEach(() => {
    splitSdk.factory = null;
    splitSdk.config = null;
  });

  it('should return an empty array if the SDK was not initialized', () => {
    expect(getSplits()).toHaveLength(0);
  });

  it('should return a SplitViews and invoke the `splits` method from manager', () => {
    initSplitSdk({ config: sdkNodeConfig });
    (splitSdk.factory as any).__splits__.mockReturnValue(featureFlagViews);

    expect(getSplits()).toBe(featureFlagViews);
    expect((splitSdk.factory as any).manager.mock.calls.length).toBe(1);
    expect((splitSdk.factory as any).__splits__.mock.calls.length).toBe(1);
  });

});

describe('track', () => {

  beforeEach(() => {
    splitSdk.factory = null;
    splitSdk.config = null;
  });

  it('should return false if the SDK was not initialized', () => {
    const errorSpy = jest.spyOn(console, 'error');
    expect(track({
      key: 'user1',
      trafficType: 'user',
      eventType: 'event',
    })).toBe(false);
    expect(errorSpy).toBeCalledWith(ERROR_TRACK_NO_INITSPLITSDK);
  });

  it('should return true and invoke the track method of the client', () => {
    initSplitSdk({ config: sdkNodeConfig });
    (splitSdk.factory as any).__client__.track.mockImplementation(() => true);

    expect(track({
      key: 'user1',
      trafficType: 'user',
      eventType: 'event',
    })).toBe(true);
    expect((splitSdk.factory as any).__client__.track.mock.calls.length).toBe(1);
    expect((splitSdk.factory as any).__client__.track.mock.calls[0][0]).toBe('user1');
    expect((splitSdk.factory as any).__client__.track.mock.calls[0][1]).toBe('user');
    expect((splitSdk.factory as any).__client__.track.mock.calls[0][2]).toBe('event');
  });

});

describe('getStatus', () => {

  beforeEach(() => {
    splitSdk.factory = null;
  });

  it('should return the default status if the SDK was not initialized', () => {
    expect(getStatus()).toEqual(STATUS_INITIAL);
  });

  it('should return the status of the main client', () => {
    initSplitSdk({ config: sdkNodeConfig });
    (splitSdk.factory as any).client().__emitter__.emit(Event.SDK_READY);

    const MAIN_CLIENT_STATUS = { ...STATUS_INITIAL, isReady: true, isOperational: true };
    expect(getStatus()).toEqual(MAIN_CLIENT_STATUS);
    expect(getStatus('ignored_key_in_server_side')).toEqual(MAIN_CLIENT_STATUS);
  });
});
