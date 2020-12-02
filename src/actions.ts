/**
 * Common action creators for browser and node.
 * They return plain actions (Flux-Standard-Actions).
 */
import { SPLIT_READY, SPLIT_READY_WITH_EVALUATIONS, SPLIT_READY_FROM_CACHE, SPLIT_UPDATE, SPLIT_TIMEDOUT, SPLIT_DESTROY, ADD_TREATMENTS, ADD_EVALUATIONS } from './constants';
import { matching } from './utils';

export function splitReady() {
  return {
    type: SPLIT_READY,
    payload: {
      timestamp: Date.now(),
    },
  };
}
// @TODO: build for ready_from_cache if applicable
export function splitReadyWithEvaluations(evaluations: Array<{
  key: string,
  treatments: SplitIO.TreatmentsWithConfig,
}>) {

  return {
    type: SPLIT_READY_WITH_EVALUATIONS,
    payload: {
      timestamp: Date.now(),
      evaluations,
    },
  };
}

export function splitReadyFromCache() {
  return {
    type: SPLIT_READY_FROM_CACHE,
    payload: {
      timestamp: Date.now(),
    },
  };
}

export function splitUpdate() {
  return {
    type: SPLIT_UPDATE,
    payload: {
      timestamp: Date.now(),
    },
  };
}

export function splitTimedout() {
  return {
    type: SPLIT_TIMEDOUT,
    payload: {
      timestamp: Date.now(),
    },
  };
}

export function splitDestroy() {
  return {
    type: SPLIT_DESTROY,
    payload: {
      timestamp: Date.now(),
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

export function addEvaluations(evaluations: Array<{
  key: string,
  treatments: SplitIO.TreatmentsWithConfig,
}>) {

  return {
    type: ADD_EVALUATIONS,
    payload: {
      evaluations,
    },
  };
}
