import React from 'react';
import { mount } from 'enzyme';

/** Mocks */
import mockStore from './utils/mockStore';
import { STATE_READY } from './utils/storeState';

/** Test targets */
import connectSplit from '../react-redux/connectSplit';

const FeatureComponent: React.ComponentType = () => null;

describe('connectSplit', () => {
  it('should pass the Split piece of state and binded getTreatment as props', () => {
    const store = mockStore(STATE_READY);

    const ConnectedFeatureComponent: React.ComponentType<any> = connectSplit()(FeatureComponent);
    const wrapper = mount(React.createElement(ConnectedFeatureComponent, { store }));
    expect(wrapper.find('FeatureComponent')).toHaveLength(1);
    const props: any = wrapper.find('FeatureComponent').props();
    expect(props.splitio).toBe(STATE_READY.splitio);
    expect(typeof props.getTreatments).toBe('function');
  });

  it('should pass the Split piece of state if it is mounted in a different key', () => {
    const store = mockStore({ otherKey: STATE_READY.splitio });

    const ConnectedFeatureComponent: React.ComponentType<any> = connectSplit((state) => state.otherKey)(FeatureComponent);
    const wrapper = mount(React.createElement(ConnectedFeatureComponent, { store }));
    expect(wrapper.find('FeatureComponent')).toHaveLength(1);
    const props: any = wrapper.find('FeatureComponent').props();
    expect(props.splitio).toBe(STATE_READY.splitio);
    expect(typeof props.getTreatments).toBe('function');
  });

});
