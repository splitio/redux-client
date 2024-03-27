import React from 'react';

/**
 * Creates a React component that exposes its props as a data attribute for testing purposes.
 */
export function createComponentWithExposedProps(testId: string) {
  return (props: any) => {
    return React.createElement('div', {
      'data-testid': testId,
      'data-props': JSON.stringify(props, (_, value) => {
        // function properties are serialized too
        return typeof value === 'function' ? {} : value;
      }),
    }, props.children);
  }
}

export function getProps(element: HTMLElement): Record<string, any> {
  return element.dataset.props && JSON.parse(element.dataset.props);
}
