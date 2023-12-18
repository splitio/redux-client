import {
  splitReducer as exportedSplitReducer,
  initSplitSdk as exportedInitSplitSdk,
  getTreatments as exportedGetTreatments,
  destroySplitSdk as exportedDestroySplitSdk,
  splitSdk as exportedSplitSdk,
  track as exportedTrack,
  getSplitNames as exportedGetSplitNames,
  getSplit as exportedGetSplit,
  getSplits as exportedGetSplits,
  selectTreatmentValue as exportedSelectTreatmentValue,
  selectTreatmentWithConfig as exportedSelectTreatmentWithConfig,
  connectSplit as exportedConnectSplit,
  connectToggler as exportedConnectToggler,
  mapTreatmentToProps as exportedMapTreatmentToProps,
  mapIsFeatureOnToProps as exportedMapIsFeatureOnToProps,
  /* eslint-disable @typescript-eslint/no-unused-vars */ // Checks that types are exported. Otherwise, the test would fail with a TS error.
  ISplitState,
} from '../index';

import { splitReducer } from '../reducer';
import { initSplitSdk, getTreatments, destroySplitSdk, splitSdk } from '../asyncActions';
import { track, getSplitNames, getSplit, getSplits } from '../helpers';
import { selectTreatmentValue, selectTreatmentWithConfig } from '../selectors';
import { connectSplit } from '../react-redux/connectSplit';
import { connectToggler, mapTreatmentToProps, mapIsFeatureOnToProps } from '../react-redux/connectToggler';

it('index should export modules', () => {

  expect(exportedSplitReducer).toBe(splitReducer);
  expect(exportedInitSplitSdk).toBe(initSplitSdk);
  expect(exportedGetTreatments).toBe(getTreatments);
  expect(exportedDestroySplitSdk).toBe(destroySplitSdk);
  expect(exportedSplitSdk).toBe(splitSdk);
  expect(exportedTrack).toBe(track);
  expect(exportedGetSplitNames).toBe(getSplitNames);
  expect(exportedGetSplit).toBe(getSplit);
  expect(exportedGetSplits).toBe(getSplits);
  expect(exportedSelectTreatmentValue).toBe(selectTreatmentValue);
  expect(exportedSelectTreatmentWithConfig).toBe(selectTreatmentWithConfig);
  expect(exportedConnectSplit).toBe(connectSplit);
  expect(exportedConnectToggler).toBe(connectToggler);
  expect(exportedMapTreatmentToProps).toBe(mapTreatmentToProps);
  expect(exportedMapIsFeatureOnToProps).toBe(mapIsFeatureOnToProps);

});
