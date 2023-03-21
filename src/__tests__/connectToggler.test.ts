import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { createComponentWithExposedProps, getProps } from './utils/reactTestingUtils';

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


const FeatureComponent = createComponentWithExposedProps('FeatureComponent');
const LegacyComponent = createComponentWithExposedProps('LegacyComponent');

describe('connectToggler', () => {
  it('should return FeatureComponent if feature is \'on\'', () => {
    const store = mockStore(STATE_READY);
    /** SPLIT_1 is ON */
    const ConnectedFeatureTogler = connectToggler(SPLIT_1)(FeatureComponent, LegacyComponent);
    render(React.createElement(ConnectedFeatureTogler, { store }));

    expect(screen.getByTestId('FeatureComponent')).toBeInTheDocument();
    expect(screen.queryByTestId('LegacyComponent')).toBeNull();
  });

  it('should return LegacyComponent if feature is not \'on\'', () => {
    const store = mockStore(STATE_READY);
    /** SPLIT_2 is OFF */
    const ConnectedFeatureTogler = connectToggler(SPLIT_2)(FeatureComponent, LegacyComponent);
    render(React.createElement(ConnectedFeatureTogler, { store }));

    expect(screen.queryByTestId('FeatureComponent')).toBeNull();
    expect(screen.getByTestId('LegacyComponent')).toBeInTheDocument();
  });

  it('should render null if not \'on\' and there was not component defined', () => {
    const store = mockStore(STATE_READY);
    /** SPLIT_2 is OFF */
    const ConnectedFeatureTogler = connectToggler(SPLIT_2)(FeatureComponent);
    render(React.createElement(ConnectedFeatureTogler, { store }));

    expect(screen.queryByTestId('FeatureComponent')).toBeNull();
    expect(screen.queryByTestId('LegacyComponent')).toBeNull();
  });

  it('should only pass direct props and not pass down any extra props from connect', () => {
    const store = mockStore(STATE_READY);

    const ConnectedFeatureTogler = connectToggler(SPLIT_1)(createComponentWithExposedProps('FeatureComponent'));
    render(React.createElement(ConnectedFeatureTogler, { store, someProp: 'expected' }));

    const element = screen.getByTestId('FeatureComponent');
    expect(element).toBeInTheDocument();
    // Important: For testing purpose we should pass store to let the test work,
    // so in this test also store object is pass down to FeatureComponent but
    // we don't test that since is not a valid use case, for testing purposes
    // we test someProp directly.
    const props = getProps(element);
    expect(props.dispatch).toBeUndefined();
    expect(props.someProp).toBe('expected');
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
