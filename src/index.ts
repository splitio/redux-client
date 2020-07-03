// For Redux
export { default as splitReducer } from './reducer';
export { initSplitSdk, getTreatments, destroySplitSdk, splitSdk } from './asyncActions';
export { track, getSplitNames, getSplit, getSplits, getStatus } from './helpers';
export { selectTreatmentValue, selectTreatmentWithConfig } from './selectors';

// For React-redux
export { default as connectSplit } from './react-redux/connectSplit';
export { connectToggler, mapTreatmentToProps, mapIsFeatureOnToProps } from './react-redux/connectToggler';
