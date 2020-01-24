import { EventEmitter } from 'events';

export const Event = {
  SDK_READY_TIMED_OUT: 'init::timeout',
  SDK_READY: 'init::ready',
  SDK_UPDATE: 'state::update',
};

function mockClient() {
  // Readiness
  let __isReady__ = false;
  let __isTimedout__ = false;
  const __emitter__ = new EventEmitter();
  __emitter__.once(Event.SDK_READY, () => { __isReady__ = true; });
  __emitter__.once(Event.SDK_READY_TIMED_OUT, () => { __isTimedout__ = true; });

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
