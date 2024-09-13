import { EventEmitter } from 'events';
import promiseWrapper from './promiseWrapper';
import SplitIO from '@splitsoftware/splitio/types/splitio';

export const Event = {
  SDK_READY_TIMED_OUT: 'init::timeout',
  SDK_READY: 'init::ready',
  SDK_READY_FROM_CACHE: 'init::cache-ready',
  SDK_UPDATE: 'state::update',
};

function parseKey(key: SplitIO.SplitKey): SplitIO.SplitKey {
  if (key && typeof key === 'object' && key.constructor === Object) {
    return {
      matchingKey: (key as SplitIO.SplitKeyObject).matchingKey,
      bucketingKey: (key as SplitIO.SplitKeyObject).bucketingKey,
    };
  } else {
    return {
      matchingKey: (key as string),
      bucketingKey: (key as string),
    };
  }
}
function buildInstanceId(key: any, trafficType: string | undefined) {
  return `${key.matchingKey ? key.matchingKey : key}-${key.bucketingKey ? key.bucketingKey : key}-${trafficType !== undefined ? trafficType : ''}`;
}

export function mockSdk() {

  return jest.fn((config: SplitIO.IBrowserSettings, __updateModules?: (modules: { settings: { version: string } }) => void) => {

    // isReadyFromCache is a shared status among clients
    let isReadyFromCache = false;

    function mockClient(key?: SplitIO.SplitKey) {
      // Readiness
      let isReady = false;
      let hasTimedout = false;
      let isDestroyed = false;
      let lastUpdate = 0;

      function syncLastUpdate() {
        const dateNow = Date.now();
        lastUpdate = dateNow > lastUpdate ? dateNow : lastUpdate + 1;
      }

      const __emitter__ = new EventEmitter();
      __emitter__.once(Event.SDK_READY, () => { isReady = true; syncLastUpdate(); });
      __emitter__.once(Event.SDK_READY_FROM_CACHE, () => { isReadyFromCache = true; syncLastUpdate(); });
      __emitter__.once(Event.SDK_READY_TIMED_OUT, () => { hasTimedout = true; syncLastUpdate(); });
      __emitter__.on(Event.SDK_UPDATE, () => { syncLastUpdate(); });

      // Client methods
      const track: jest.Mock = jest.fn((tt, et, v, p) => {
        if (!(key || !config.core.trafficType)) {
          p = v;
          v = et;
          et = tt;
          tt = config.core.trafficType;
        }
        return typeof tt === 'string' &&
          typeof et === 'string' &&
          (typeof v === 'number' || typeof v === 'undefined') &&
          (typeof p === 'object' || typeof p === 'undefined');
      });
      const getTreatmentsWithConfig: jest.Mock = jest.fn((featureFlagNames) => {
        return featureFlagNames.reduce((acc: SplitIO.TreatmentsWithConfig, featureFlagName: string) => {
          acc[featureFlagName] = { treatment: 'fakeTreatment', config: null };
          return acc;
        }, {});
      });
      const getTreatmentsWithConfigByFlagSets: jest.Mock = jest.fn((flagSets) => {
        return flagSets.reduce((acc: SplitIO.TreatmentsWithConfig, flagSet: string) => {
          acc[flagSet + '_feature_flag'] = { treatment: 'fakeTreatment', config: null };
          return acc;
        }, {});
      });
      const setAttributes: jest.Mock = jest.fn(() => {
        return true;
      });
      const clearAttributes: jest.Mock = jest.fn(() => {
        return true;
      });
      const getAttributes: jest.Mock = jest.fn(() => {
        return true;
      });
      const ready: jest.Mock = jest.fn(() => {
        return promiseWrapper(new Promise<void>((res, rej) => {
          isReady ? res() : __emitter__.on(Event.SDK_READY, res);
          hasTimedout ? rej() : __emitter__.on(Event.SDK_READY_TIMED_OUT, rej);
        }), () => { });
      });
      const __getStatus = () => ({
        isReady,
        isReadyFromCache,
        isTimedout: hasTimedout && !isReady,
        hasTimedout,
        isDestroyed,
        isOperational: (isReady || isReadyFromCache) && !isDestroyed,
        lastUpdate,
      });
      const destroy: jest.Mock = jest.fn(() => {
        isDestroyed = true;
        syncLastUpdate();
        return new Promise((res) => { setTimeout(res, 100); });
      });

      return Object.assign(Object.create(__emitter__), {
        getTreatmentsWithConfig,
        getTreatmentsWithConfigByFlagSets,
        track,
        ready,
        destroy,
        Event,
        setAttributes,
        clearAttributes,
        getAttributes,
        // EventEmitter exposed to trigger events manually
        __emitter__,
        // Clients expose a `__getStatus` method, that is not considered part of the public API, to get client readiness status (isReady, isReadyFromCache, isTimedout, hasTimedout, isDestroyed, isOperational, lastUpdate)
        __getStatus,
      });
    }

    // Manager
    const names: jest.Mock = jest.fn().mockReturnValue([]);
    const split: jest.Mock = jest.fn().mockReturnValue(null);
    const splits: jest.Mock = jest.fn().mockReturnValue([]);
    const manager: jest.Mock = jest.fn().mockReturnValue({ names, split, splits });

    // Cache of clients
    const __clients__: { [key: string]: any } = {};
    const client = jest.fn((key?: SplitIO.SplitKey) => {
      const clientKey = key || parseKey(config.core.key);
      const clientTT = key ? undefined : config.core.trafficType;
      const instanceId = buildInstanceId(clientKey, clientTT);
      return __clients__[instanceId] || (__clients__[instanceId] = mockClient(key));
    });

    const modules = { settings: { version: 'javascript-10.18.0' } };
    if (__updateModules) __updateModules(modules);

    // SDK factory
    const factory = {
      client,
      manager,
      settings: modules.settings,
      __names__: names,
      __split__: split,
      __splits__: splits,
    };

    return factory;
  });

}
