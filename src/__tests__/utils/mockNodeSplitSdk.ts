import { EventEmitter } from 'events';

export const Event = {
  SDK_READY_TIMED_OUT: 'init::timeout',
  SDK_READY: 'init::ready',
  SDK_UPDATE: 'state::update',
};

function mockClient() {
  // Readiness
  let __isReady__: boolean | undefined;
  let __hasTimedout__: boolean | undefined;
  let __isDestroyed__: boolean | undefined;
  const __emitter__ = new EventEmitter();
  __emitter__.once(Event.SDK_READY, () => { __isReady__ = true; });
  __emitter__.once(Event.SDK_READY_TIMED_OUT, () => { __hasTimedout__ = true; });

  // Client methods
  const track: jest.Mock = jest.fn(() => {
    return true;
  });
  const getTreatmentsWithConfig: jest.Mock = jest.fn(() => {
    return 'getTreatmentsWithConfig';
  });
  const ready: jest.Mock = jest.fn(() => {
    return new Promise((res, rej) => {
      __isReady__ ? res() : __emitter__.on(Event.SDK_READY, res);
      __hasTimedout__ ? rej() : __emitter__.on(Event.SDK_READY_TIMED_OUT, rej);
    });
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
    // Client context exposed to get readiness status (READY, HAS_TIMEDOUT, DESTROYED)
    __context: context,
  });
}

export function mockSdk() {

  return jest.fn((config: SplitIO.INodeSettings) => {

    // Manager
    const names: jest.Mock = jest.fn().mockReturnValue([]);
    const split: jest.Mock = jest.fn().mockReturnValue(null);
    const splits: jest.Mock = jest.fn().mockReturnValue([]);
    const manager: jest.Mock = jest.fn().mockReturnValue({ names, split, splits });

    // Client (only one client on Node SDK)
    const __client__ = mockClient();
    const client = jest.fn(() => {
      return __client__;
    });

    // SDK factory
    const factory = {
      client,
      manager,
      settings: { version: 'nodejs-10.9.2' },
      __names__: names,
      __split__: split,
      __splits__: splits,
      __client__,
    };

    return factory;
  });

}
