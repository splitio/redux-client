// SplitIO namespace
import '@splitsoftware/splitio';

// For Redux
export { splitReducer } from './reducer';
export { initSplitSdk, getTreatments, destroySplitSdk, splitSdk } from './asyncActions';
export { track, getSplitNames, getSplit, getSplits, getStatus } from './helpers';
export { selectTreatmentValue, selectTreatmentWithConfig, selectTreatmentAndStatus, selectTreatmentWithConfigAndStatus, selectStatus } from './selectors';

// For React-redux
export { connectSplit } from './react-redux/connectSplit';
export { connectToggler, mapTreatmentToProps, mapIsFeatureOnToProps } from './react-redux/connectToggler';

// Types
export { IStatus, ISplitState, IGetSplitState, IInitSplitSdkParams, IGetTreatmentsParams, IDestroySplitSdkParams, ITrackParams } from './types';
