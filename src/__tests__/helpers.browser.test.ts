/** Mocks */
import { mockSdk, Event } from './utils/mockBrowserSplitSdk';
jest.mock('@splitsoftware/splitio', () => {
  return { SplitFactory: mockSdk() };
});

/** Constants, types, utils */
import { sdkBrowserConfig } from './utils/sdkConfigs';
import { STATUS_INITIAL } from './utils/storeState';
import {
  getTreatments,
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
    initSplitSdk({ config: sdkBrowserConfig });
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
    initSplitSdk({ config: sdkBrowserConfig });
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
    initSplitSdk({ config: sdkBrowserConfig });
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

  it('logs error and returns false if the SDK was not initialized', () => {
    const errorSpy = jest.spyOn(console, 'error');
    expect(track({ eventType: 'event' })).toBe(false);
    expect(errorSpy).toBeCalledWith(ERROR_TRACK_NO_INITSPLITSDK);
  });

  it('should invoke the track method of the main client (no traffic type in config)', () => {
    initSplitSdk({ config: sdkBrowserConfig });

    expect(track({ eventType: 'event', trafficType: 'user' })).toBe(true);
    expect((splitSdk.factory as any).client().track.mock.calls.length).toBe(1);
    expect((splitSdk.factory as any).client().track.mock.calls[0][0]).toBe('user');
    expect((splitSdk.factory as any).client().track.mock.calls[0][1]).toBe('event');

    // TT must be provided if not included in the config
    expect(track({ eventType: 'event' })).toBe(false);
  });

  it('should invoke the track method of the main client (traffic type in config)', () => {
    initSplitSdk({ config: { ...sdkBrowserConfig, core: { ...sdkBrowserConfig.core, trafficType: 'user' } } });

    expect(track({ eventType: 'event' })).toBe(true);
    expect((splitSdk.factory as any).client().track.mock.calls.length).toBe(1);
    expect((splitSdk.factory as any).client().track.mock.calls[0][0]).toBe('event');

    // TT is ignored if included in the config
    expect(track({ eventType: 'event', trafficType: 'user' })).toBe(true);
  });

  it('should invoke the track method of a shared client (no traffic type in config)', () => {
    initSplitSdk({ config: sdkBrowserConfig });

    expect(track({ eventType: 'event', key: 'user1', trafficType: 'user' })).toBe(true);
    expect((splitSdk.factory as any).client('user1').track.mock.calls.length).toBe(1);
    expect((splitSdk.factory as any).client('user1').track.mock.calls[0][0]).toBe('user');
    expect((splitSdk.factory as any).client('user1').track.mock.calls[0][1]).toBe('event');

    // TT must be provided if key is provided
    expect(track({ eventType: 'event', key: 'user1' })).toBe(false);
  });

  it('should invoke the track method of a shared client (traffic type in config)', () => {
    initSplitSdk({ config: { ...sdkBrowserConfig, core: { ...sdkBrowserConfig.core, trafficType: 'user' } } });

    expect(track({ eventType: 'event', key: 'user1', trafficType: 'user' })).toBe(true);
    expect((splitSdk.factory as any).client('user1').track.mock.calls.length).toBe(1);
    expect((splitSdk.factory as any).client('user1').track.mock.calls[0][0]).toBe('user');
    expect((splitSdk.factory as any).client('user1').track.mock.calls[0][1]).toBe('event');

    // TT must be provided if key is provided, no matter if present in the config, since that TT is for main client
    expect(track({ eventType: 'event', key: 'user1' })).toBe(false);
  });

});

describe('getStatus', () => {

  beforeEach(() => {
    splitSdk.factory = null;
  });

  it('should return the default status if the SDK was not initialized', () => {
    expect(getStatus()).toEqual(STATUS_INITIAL);
  });

  it('should return the status of the client associated to the provided key', () => {
    initSplitSdk({ config: sdkBrowserConfig });
    getTreatments({ key: 'user_2', splitNames: ['split_1'] });
    (splitSdk.factory as any).client().__emitter__.emit(Event.SDK_READY_FROM_CACHE);
    (splitSdk.factory as any).client('user_2').__emitter__.emit(Event.SDK_READY);

    // Main client
    const MAIN_CLIENT_STATUS = { ...STATUS_INITIAL, isReadyFromCache: true, isOperational: true, lastUpdate: (splitSdk.factory.client() as any).__getStatus().lastUpdate };
    expect(getStatus()).toEqual(MAIN_CLIENT_STATUS);
    expect(getStatus(sdkBrowserConfig.core.key)).toEqual(MAIN_CLIENT_STATUS);
    expect(getStatus({ matchingKey: sdkBrowserConfig.core.key as string, bucketingKey: '' })).toEqual(MAIN_CLIENT_STATUS);

    // Client for user_2
    const USER_2_STATUS = { ...STATUS_INITIAL, isReady: true, isReadyFromCache: true, isOperational: true, lastUpdate: (splitSdk.factory.client('user_2') as any).__getStatus().lastUpdate };
    expect(getStatus('user_2')).toEqual(USER_2_STATUS);
    expect(getStatus({ matchingKey: 'user_2', bucketingKey: '' })).toEqual(USER_2_STATUS);

    // Non-existing client
    expect(getStatus('non_existing_key')).toEqual(STATUS_INITIAL);
  });
});
