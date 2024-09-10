/**
 * Common action creators for browser and node.
 * They return plain actions (Flux-Standard-Actions).
 */
import {
  SPLIT_READY, SPLIT_READY_WITH_EVALUATIONS, SPLIT_READY_FROM_CACHE, SPLIT_READY_FROM_CACHE_WITH_EVALUATIONS,
  SPLIT_UPDATE, SPLIT_UPDATE_WITH_EVALUATIONS, SPLIT_TIMEDOUT, SPLIT_DESTROY, ADD_TREATMENTS,
} from './constants';
import { matching } from './utils';

export function splitReady(timestamp: number) {
  return {
    type: SPLIT_READY,
    payload: {
      timestamp,
    },
  };
}

export function splitReadyWithEvaluations(key: SplitIO.SplitKey, treatments: SplitIO.TreatmentsWithConfig, timestamp: number) {
  return {
    type: SPLIT_READY_WITH_EVALUATIONS,
    payload: {
      timestamp,
      key: matching(key),
      treatments,
    },
  };
}

export function splitReadyFromCache(timestamp: number) {
  return {
    type: SPLIT_READY_FROM_CACHE,
    payload: {
      timestamp,
    },
  };
}

export function splitReadyFromCacheWithEvaluations(key: SplitIO.SplitKey, treatments: SplitIO.TreatmentsWithConfig, timestamp: number) {
  return {
    type: SPLIT_READY_FROM_CACHE_WITH_EVALUATIONS,
    payload: {
      timestamp,
      key: matching(key),
      treatments,
    },
  };
}

export function splitUpdate(timestamp: number) {
  return {
    type: SPLIT_UPDATE,
    payload: {
      timestamp,
    },
  };
}

export function splitUpdateWithEvaluations(key: SplitIO.SplitKey, treatments: SplitIO.TreatmentsWithConfig, timestamp: number) {
  return {
    type: SPLIT_UPDATE_WITH_EVALUATIONS,
    payload: {
      timestamp,
      key: matching(key),
      treatments,
    },
  };
}

export function splitTimedout(timestamp: number) {
  return {
    type: SPLIT_TIMEDOUT,
    payload: {
      timestamp,
    },
  };
}

export function splitDestroy(timestamp: number) {
  return {
    type: SPLIT_DESTROY,
    payload: {
      timestamp,
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
