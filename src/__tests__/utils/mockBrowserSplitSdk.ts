import { EventEmitter } from 'events';

export const Event = {
  SDK_READY_TIMED_OUT: 'init::timeout',
  SDK_READY: 'init::ready',
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
      let __isReady__ = false;
      let __isTimedout__ = false;
      const __emitter__ = new EventEmitter();
      __emitter__.once(Event.SDK_READY, () => { __isReady__ = true; });
      __emitter__.once(Event.SDK_READY_TIMED_OUT, () => { __isTimedout__ = true; });

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
      const getTreatmentsWithConfig: jest.Mock = jest.fn(() => {
        return 'getTreatmentsWithConfig';
      });
      const ready: jest.Mock = jest.fn(() => {
        return new Promise((res, rej) => {
          __isReady__ ? res() : __emitter__.on(Event.SDK_READY, res);
          __isTimedout__ ? rej() : __emitter__.on(Event.SDK_READY_TIMED_OUT, rej);
        });
      });

      return Object.assign(Object.create(__emitter__), {
        getTreatmentsWithConfig,
        track,
        ready,
        Event,
        // EventEmitter exposed to trigger events manually
        __emitter__,
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
