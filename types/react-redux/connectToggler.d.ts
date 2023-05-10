/// <reference types="react" />
import { IGetSplitState } from '../types';
/**
 * Looks on the features of the Split piece of state, and maps to isFeatureOn
 * depending if this feature is ON or not
 *
 * @param {string} featureFlagName featureFlag name
 * @param {SplitIO.SplitKey} key user key
 * @param {IGetSplitState} getSplitState function that extract the Split piece of state from the Redux state.
 */
export declare function mapIsFeatureOnToProps(featureFlagName: string, key?: SplitIO.SplitKey, getSplitState?: IGetSplitState): (state: any) => {
    isFeatureOn: boolean;
};
/**
 * Looks on the features of the Split piece of state, and maps to feature
 * the value of this feature
 *
 * @param {string} featureFlagName featureFlag name
 * @param {SplitIO.SplitKey} key user key
 * @param {IGetSplitState} getSplitState function that extract the Split piece of state from the Redux state.
 */
export declare function mapTreatmentToProps(featureFlagName: string, key?: SplitIO.SplitKey, getSplitState?: IGetSplitState): (state: any) => {
    feature: string;
};
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
export declare function connectToggler(featureFlagName: string, key?: SplitIO.SplitKey, getSplitState?: IGetSplitState): (ComponentOn: React.ComponentType, ComponentDefault?: React.ComponentType) => import("react-redux").ConnectedComponent<({ isFeatureOn, ...props }: {
    isFeatureOn: boolean;
}) => import("react").ReactElement<{}, string | import("react").JSXElementConstructor<any>>, {
    [x: string]: any;
}>;
