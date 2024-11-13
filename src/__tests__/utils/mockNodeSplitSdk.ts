import { EventEmitter } from 'events';
import promiseWrapper from './promiseWrapper';
import SplitIO from '@splitsoftware/splitio/types/splitio';

export const Event = {
  SDK_READY_TIMED_OUT: 'init::timeout',
  SDK_READY: 'init::ready',
  SDK_UPDATE: 'state::update',
};

function mockClient() {
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
  __emitter__.once(Event.SDK_READY_TIMED_OUT, () => { hasTimedout = true; syncLastUpdate(); });
  __emitter__.on(Event.SDK_UPDATE, () => { syncLastUpdate(); });

  // Client methods
  const track: jest.Mock = jest.fn((key, tt, et, v, p) => {
    return typeof key === 'string' &&
      typeof tt === 'string' &&
      typeof et === 'string' &&
      (typeof v === 'number' || typeof v === 'undefined') &&
      (typeof p === 'object' || typeof p === 'undefined');
  });
  const getTreatmentsWithConfig: jest.Mock = jest.fn((key, featureFlagNames) => {
    return featureFlagNames.reduce((acc: SplitIO.TreatmentsWithConfig, featureFlagName: string) => {
      acc[featureFlagName] = { treatment: 'fakeTreatment', config: null };
      return acc;
    }, {});
  });
  const getTreatmentsWithConfigByFlagSets: jest.Mock = jest.fn((key, flagSets) => {
    return flagSets.reduce((acc: SplitIO.TreatmentsWithConfig, flagSet: string) => {
      acc[flagSet + '_feature_flag'] = { treatment: 'fakeTreatment', config: null };
      return acc;
    }, {});
  });
  const ready: jest.Mock = jest.fn(() => {
    return promiseWrapper(new Promise<void>((res, rej) => {
      isReady ? res() : __emitter__.on(Event.SDK_READY, res);
      hasTimedout ? rej() : __emitter__.on(Event.SDK_READY_TIMED_OUT, rej);
    }), () => { });
  });
  const __getStatus = () => ({
    isReady,
    isReadyFromCache: false,
    isTimedout: hasTimedout && !isReady,
    hasTimedout,
    isDestroyed,
    isOperational: isReady && !isDestroyed,
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
    // EventEmitter exposed to trigger events manually
    __emitter__,
    // Clients expose a `__getStatus` method, that is not considered part of the public API, to get client readiness status (isReady, isReadyFromCache, isTimedout, hasTimedout, isDestroyed, isOperational, lastUpdate)
    __getStatus,
  });
}

export function mockSdk() {

  return jest.fn((config: SplitIO.INodeSettings, __updateModules?: (modules: { settings: { version: string } }) => void) => {

    // Manager
    const names: jest.Mock = jest.fn().mockReturnValue([]);
    const split: jest.Mock = jest.fn().mockReturnValue(null);
    const splits: jest.Mock = jest.fn().mockReturnValue([]);
    const manager: jest.Mock = jest.fn().mockReturnValue({ names, split, splits });

    // Client (only one client on Node.js)
    const __client__ = mockClient();
    const client = jest.fn(() => {
      return __client__;
    });

    // Factory destroy
    const destroy = jest.fn(() => {
      return __client__.destroy();
    });

    const modules = { settings: { version: 'nodejs-10.18.0' } };
    if (__updateModules) __updateModules(modules);

    // SDK factory
    const factory = {
      client,
      manager,
      destroy,
      settings: modules.settings,
      __names__: names,
      __split__: split,
      __splits__: splits,
      __client__,
    };

    return factory;
  });

}
