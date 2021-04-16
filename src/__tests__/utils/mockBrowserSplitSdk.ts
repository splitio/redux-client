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
      const ready: jest.Mock = jest.fn(() => {
        return promiseWrapper(new Promise((res, rej) => {
          __isReady__ ? res(null) : __emitter__.on(Event.SDK_READY, res);
          __hasTimedout__ ? rej() : __emitter__.on(Event.SDK_READY_TIMED_OUT, rej);
        }), () => { });
      });
      const context = {
        constants: {
          READY: 'is_ready',
          READY_FROM_CACHE: 'is_ready_from_cache',
          HAS_TIMEDOUT: 'has_timedout',
          DESTROYED: 'is_destroyed',
        },
        get(name: string, flagCheck: boolean = false): boolean | undefined {
          if (flagCheck !== true) throw new Error('Don\'t use promise result on SDK context');
          switch (name) {
            case this.constants.READY:
              return __isReady__;
            case this.constants.READY_FROM_CACHE:
              return __isReadyFromCache__;
            case this.constants.HAS_TIMEDOUT:
              return __hasTimedout__;
            case this.constants.DESTROYED:
              return __isDestroyed__;
          }
          throw new Error(`We shouldn't be accessing property "${name}" from the context`);
        },
      };
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
        // EventEmitter exposed to trigger events manually
        __emitter__,
        // Client context exposed to get readiness status (READY, READY_FROM_CACHE, HAS_TIMEDOUT, DESTROYED)
        __context: context,
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
