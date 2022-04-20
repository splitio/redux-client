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

  return jest.fn((config: SplitIO.IBrowserSettings) => {

    function mockClient(key?: SplitIO.SplitKey) {
      // Readiness
      let __isReady__: boolean | undefined;
      let __isReadyFromCache__: boolean | undefined;
      let __hasTimedout__: boolean | undefined;
      let __isDestroyed__: boolean | undefined;
      const __emitter__ = new EventEmitter();
      __emitter__.once(Event.SDK_READY, () => { __isReady__ = true; });
      __emitter__.once(Event.SDK_READY_FROM_CACHE, () => { __isReadyFromCache__ = true; });
      __emitter__.once(Event.SDK_READY_TIMED_OUT, () => { __hasTimedout__ = true; });

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
      const getTreatmentsWithConfig: jest.Mock = jest.fn((splitNames) => {
        return splitNames.reduce((acc: SplitIO.TreatmentsWithConfig, splitName: string) => {
          acc[splitName] = { treatment: 'fakeTreatment', config: null };
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
          __isReady__ ? res() : __emitter__.on(Event.SDK_READY, res);
          __hasTimedout__ ? rej() : __emitter__.on(Event.SDK_READY_TIMED_OUT, rej);
        }), () => { });
      });
      const __getStatus = () => ({
        isReady: __isReady__ || false,
        isReadyFromCache: __isReadyFromCache__ || false,
        hasTimedout: __hasTimedout__ || false,
        isDestroyed: __isDestroyed__ || false,
        isOperational: ((__isReady__ || __isReadyFromCache__) && !__isDestroyed__) || false,
      });
      const destroy: jest.Mock = jest.fn(() => {
        __isDestroyed__ = true;
        return new Promise((res, rej) => { setTimeout(res, 100); });
      });

      return Object.assign(Object.create(__emitter__), {
        getTreatmentsWithConfig,
        track,
        ready,
        destroy,
        Event,
        setAttributes,
        clearAttributes,
        getAttributes,
        // EventEmitter exposed to trigger events manually
        __emitter__,
        // Clients expose a `__getStatus` method, that is not considered part of the public API, to get client readiness status (isReady, isReadyFromCache, isOperational, hasTimedout, isDestroyed)
        __getStatus,
        isClientSide: true
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

    // SDK factory
    const factory = {
      client,
      manager,
      settings: { version: 'javascript-10.9.2' },
      __names__: names,
      __split__: split,
      __splits__: splits,
    };

    return factory;
  });

}
