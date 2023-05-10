import { connect } from 'react-redux';
import { createElement } from 'react';
import { ISplitState, IGetSplitState } from '../types';
import { selectTreatmentValue, defaultGetSplitState } from '../selectors';
import { ON } from '../constants';

const NullRenderComponent: React.ComponentType = () => null;

/**
 * To avoid passing down dispatch property, merge props override default
 * behaviour from connect. Here dispatchProps are not passing down.
 *
 * @param {any} stateProps
 * @param {any} dispatchProps
 * @param {any} ownProps
 */
const mergeProps = (stateProps: any, dispatchProps: any, ownProps: any) => ({
  ...stateProps,
  ...ownProps,
});

/**
 *  This toggler just returns a react component that decides which component to render
 * regarding it props.
 *
 * @param {React.ComponentType} ComponentOn
 * @param {React.ComponentType} ComponentDefault
 */
const toggler = (ComponentOn: React.ComponentType, ComponentDefault: React.ComponentType = NullRenderComponent) =>
  ({ isFeatureOn, ...props }: { isFeatureOn: boolean }) =>
    isFeatureOn ? (createElement(ComponentOn, props)) : (createElement(ComponentDefault, props));

/**
 * Looks on the features of the Split piece of state, and maps to isFeatureOn
 * depending if this feature is ON or not
 *
 * @param {string} featureFlagName featureFlag name
 * @param {SplitIO.SplitKey} key user key
 * @param {IGetSplitState} getSplitState function that extract the Split piece of state from the Redux state.
 */
export function mapIsFeatureOnToProps(featureFlagName: string, key?: SplitIO.SplitKey, getSplitState: IGetSplitState = defaultGetSplitState) {
  return (state: any) => {
    const splitState: ISplitState = getSplitState(state);
    return {
      isFeatureOn: selectTreatmentValue(splitState, featureFlagName, key) === ON,
    };
  };
}

/**
 * Looks on the features of the Split piece of state, and maps to feature
 * the value of this feature
 *
 * @param {string} featureFlagName featureFlag name
 * @param {SplitIO.SplitKey} key user key
 * @param {IGetSplitState} getSplitState function that extract the Split piece of state from the Redux state.
 */
export function mapTreatmentToProps(featureFlagName: string, key?: SplitIO.SplitKey, getSplitState: IGetSplitState = defaultGetSplitState): (state: any) => { feature: string } {
  return (state: any) => {
    const splitState: ISplitState = getSplitState(state);
    return {
      feature: selectTreatmentValue(splitState, featureFlagName, key),
    };
  };
}

/**
 *
 * Returns a connected component that wraps the toggler
 * The idea of this is to send the isFeatureOn prop to the toggler
 *
 * So connect send the global state and the toggler decide which to render
 *
 * @param {string} featureFlagtName featureFlag name
 * @param {SplitIO.SplitKey} key user key
 * @param {IGetSplitState} getSplitState function that extract the Split piece of state from the Redux state.
 */
export function connectToggler(featureFlagName: string, key?: SplitIO.SplitKey, getSplitState: IGetSplitState = defaultGetSplitState) {
  return (ComponentOn: React.ComponentType, ComponentDefault?: React.ComponentType) =>
    connect(mapIsFeatureOnToProps(featureFlagName, key, getSplitState), null, mergeProps)(toggler(ComponentOn, ComponentDefault));
}
