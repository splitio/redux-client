import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { createComponentWithExposedProps, getProps } from './utils/reactTestingUtils';

/** Mocks */
import mockStore from './utils/mockStore';
import { STATE_READY } from './utils/storeState';

/** Test targets */
import { connectSplit } from '../react-redux/connectSplit';

const FeatureComponent = createComponentWithExposedProps('FeatureComponent');

describe('connectSplit', () => {
  it('should pass the Split piece of state and binded getTreatment as props', () => {
    const store = mockStore(STATE_READY);

    const ConnectedFeatureComponent: React.ComponentType<any> = connectSplit()(FeatureComponent);
    render(React.createElement(ConnectedFeatureComponent, { store }));

    const featureComponent = screen.getByTestId('FeatureComponent');
    expect(featureComponent).toBeInTheDocument();

    const props = getProps(featureComponent);
    expect(props.splitio).toEqual(STATE_READY.splitio);
    expect(props.getTreatments).toBeDefined();
  });

  it('should pass the Split piece of state if it is mounted in a different key', () => {
    const store = mockStore({ otherKey: STATE_READY.splitio });

    const ConnectedFeatureComponent: React.ComponentType<any> = connectSplit((state) => state.otherKey)(FeatureComponent);
    render(React.createElement(ConnectedFeatureComponent, { store }));

    const featureComponent = screen.getByTestId('FeatureComponent');
    expect(featureComponent).toBeInTheDocument();

    const props = getProps(featureComponent);
    expect(props.splitio).toBeDefined();
    expect(props.getTreatments).toBeDefined();
  });

});
