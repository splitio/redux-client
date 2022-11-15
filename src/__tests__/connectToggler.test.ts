import React from 'react';
import { shallow, mount } from 'enzyme';

/** Mocks */
import mockStore from './utils/mockStore';
import { SPLIT_1, SPLIT_2, SPLIT_INVALID, STATE_READY } from './utils/storeState';

/** Constants */
import { ON, OFF, CONTROL } from '../constants';

/** Test targets */
import {
  connectToggler,
  mapIsFeatureOnToProps,
  mapTreatmentToProps,
} from '../react-redux/connectToggler';

const FeatureComponent: React.ComponentType = () => null;
const LegacyComponent: React.ComponentType = () => null;

describe('connectToggler', () => {
  it('should return FeatureComponent if feature is \'on\'', () => {
    const store = mockStore(STATE_READY);
    /** SPLIT_1 is ON */
    const ConnectedFeatureTogler = connectToggler(SPLIT_1)(FeatureComponent, LegacyComponent);
    const wrapper = mount(React.createElement(ConnectedFeatureTogler, { store }));

    expect(wrapper.find('FeatureComponent')).toHaveLength(1);
    expect(wrapper.find('LegacyComponent')).toHaveLength(0);
  });

  it('should return LegacyComponent if feature is not \'on\'', () => {
    const store = mockStore(STATE_READY);
    /** SPLIT_2 is OFF */
    const ConnectedFeatureTogler = connectToggler(SPLIT_2)(FeatureComponent, LegacyComponent);
    const wrapper = mount(React.createElement(ConnectedFeatureTogler, { store }));

    expect(wrapper.find('FeatureComponent')).toHaveLength(0);
    expect(wrapper.find('LegacyComponent')).toHaveLength(1);
  });

  it('should render null if not \'on\' and there was not component defined', () => {
    const store = mockStore(STATE_READY);
    /** SPLIT_2 is OFF */
    const ConnectedFeatureTogler = connectToggler(SPLIT_2)(FeatureComponent);
    const wrapper = mount(React.createElement(ConnectedFeatureTogler, { store }));
    expect(wrapper.find('FeatureComponent')).toHaveLength(0);
    expect(wrapper.find('LegacyComponent')).toHaveLength(0);
  });

  it('should only pass direct props and not pass down any extra props from connect', () => {
    const store = mockStore(STATE_READY);

    const ConnectedFeatureTogler = connectToggler(SPLIT_1)(FeatureComponent);
    const wrapper = mount(React.createElement(ConnectedFeatureTogler, { store, someProp: 'expected' }));

    expect(wrapper.find('FeatureComponent')).toHaveLength(1);
    // Important: For testing purpose we should pass store to let the test work,
    // so in this test also store object is pass down to FeatureComponent but
    // we don't test that since is not a valid use case, for testing purposes
    // we test someProp directly.
    expect((wrapper.find('FeatureComponent').props() as any).dispatch).toBeUndefined();
    expect((wrapper.find('FeatureComponent').props() as any).someProp).toBeDefined();

  });
});

describe('mapIsFeatureOnToProps', () => {
  it('should return a mapStateToProps function that retrieves isFeatureOn corresponding to the feature treatment state', () => {
    /** if feature exist in state and is 'on', isFeatureOn should be true */
    expect(mapIsFeatureOnToProps(SPLIT_1)(STATE_READY).isFeatureOn).toBe(true);
    /** if feature is 'off' or does not exist, isFeatureOn should be false */
    expect(mapIsFeatureOnToProps(SPLIT_2)(STATE_READY).isFeatureOn).toBe(false);
    expect(mapIsFeatureOnToProps(SPLIT_INVALID)(STATE_READY).isFeatureOn).toBe(false);
  });
});

describe('mapTreatmentToProps', () => {
  it('should return a mapStateToProps function that retrieves feature corresponding to the feature treatment value', () => {
    /** if feature exist in state and is 'on', feature prop should be 'on' */
    expect(mapTreatmentToProps(SPLIT_1)(STATE_READY).feature).toBe(ON);
    /** if feature is 'off', feature prop should be 'off' */
    expect(mapTreatmentToProps(SPLIT_2)(STATE_READY).feature).toBe(OFF);
    /** if feature does not exist, feature prop should be 'control' */
    expect(mapTreatmentToProps(SPLIT_INVALID)(STATE_READY).feature).toBe(CONTROL);
  });
});
