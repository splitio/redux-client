/**
 * Common action creators for browser and node.
 * They return plain actions (Flux-Standard-Actions).
 */
import {
  SPLIT_READY, SPLIT_READY_WITH_EVALUATIONS, SPLIT_READY_FROM_CACHE, SPLIT_READY_FROM_CACHE_WITH_EVALUATIONS,
  SPLIT_UPDATE, SPLIT_UPDATE_WITH_EVALUATIONS, SPLIT_TIMEDOUT, SPLIT_DESTROY, ADD_TREATMENTS,
} from './constants';
import { matching } from './utils';

export function splitReady(timestamp: number, key?: SplitIO.SplitKey) {
  return {
    type: SPLIT_READY,
    payload: {
      timestamp,
      key: matching(key),
    },
  };
}

export function splitReadyWithEvaluations(key: SplitIO.SplitKey, treatments: SplitIO.TreatmentsWithConfig, timestamp: number, nonDefaultKey?: boolean) {
  return {
    type: SPLIT_READY_WITH_EVALUATIONS,
    payload: {
      timestamp,
      key: matching(key),
      treatments,
      nonDefaultKey,
    },
  };
}

export function splitReadyFromCache(timestamp: number, key?: SplitIO.SplitKey) {
  return {
    type: SPLIT_READY_FROM_CACHE,
    payload: {
      timestamp,
      key: matching(key),
    },
  };
}

export function splitReadyFromCacheWithEvaluations(key: SplitIO.SplitKey, treatments: SplitIO.TreatmentsWithConfig, timestamp: number, nonDefaultKey?: boolean) {
  return {
    type: SPLIT_READY_FROM_CACHE_WITH_EVALUATIONS,
    payload: {
      timestamp,
      key: matching(key),
      treatments,
      nonDefaultKey,
    },
  };
}

export function splitUpdate(timestamp: number, key?: SplitIO.SplitKey) {
  return {
    type: SPLIT_UPDATE,
    payload: {
      timestamp,
      key: matching(key),
    },
  };
}

export function splitUpdateWithEvaluations(key: SplitIO.SplitKey, treatments: SplitIO.TreatmentsWithConfig, timestamp: number, nonDefaultKey?: boolean) {
  return {
    type: SPLIT_UPDATE_WITH_EVALUATIONS,
    payload: {
      timestamp,
      key: matching(key),
      treatments,
      nonDefaultKey,
    },
  };
}

export function splitTimedout(timestamp: number, key?: SplitIO.SplitKey) {
  return {
    type: SPLIT_TIMEDOUT,
    payload: {
      timestamp,
      key: matching(key),
    },
  };
}

export function splitDestroy(timestamp: number, key?: SplitIO.SplitKey) {
  return {
    type: SPLIT_DESTROY,
    payload: {
      timestamp,
      key: matching(key),
    },
  };
}

export function addTreatments(key: SplitIO.SplitKey, treatments: SplitIO.TreatmentsWithConfig) {
  return {
    type: ADD_TREATMENTS,
    payload: {
      key: matching(key),
      treatments,
    },
  };
}
