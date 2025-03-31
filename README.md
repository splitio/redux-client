# Split SDK for Redux

[![npm version](https://badge.fury.io/js/%40splitsoftware%2Fsplitio-redux.svg)](https://badge.fury.io/js/%40splitsoftware%2Fsplitio-redux) [![Build Status](https://github.com/splitio/redux-client/actions/workflows/ci.yml/badge.svg)](https://github.com/splitio/redux-client/actions/workflows/ci.yml)

## Overview
This SDK is designed to work with Split, the platform for controlled rollouts, which serves features to your users via feature flags to manage your complete customer experience.

[![Twitter Follow](https://img.shields.io/twitter/follow/splitsoftware.svg?style=social&label=Follow&maxAge=1529000)](https://twitter.com/intent/follow?screen_name=splitsoftware)

## Compatibility

This SDK is compatible with Redux v2.0.0 and later, and React-Redux v4.0.0 and later.

## Getting started

Below is a simple example that describes the instantiation and most basic usage of our SDK:

```javascript
// Import modules
import React from 'react';
import { createStore, applyMiddleware, combineReducers } from 'redux';
import { Provider } from 'react-redux';
import { splitReducer, initSplitSdk, getTreatments,
  selectTreatmentAndStatus, connectSplit } from '@splitsoftware/splitio-redux'

// Init Redux store
const store = createStore(
  combineReducers({
    splitio: splitReducer
    // You'll have your app reducers here too
  }),
  applyMiddleware(thunk)
);

// Define your config object and dispatch `initSplitSdk` action to init the SDK
const CONFIG = {
  core: {
    authorizationKey: 'YOUR_SDK_KEY',
    key: 'CUSTOMER_ID'
  }
};
store.dispatch(initSplitSdk({ config: CONFIG }))

// Dispach a `getTreatments` action to evaluate one or more feature flags.
// The evaluation is done asynchronously when the SDK is ready.
store.dispatch(getTreatments({ splitNames: 'FEATURE_FLAG_NAME' }))

// Connect your component to splitio's piece of state
const MyComponent = connectSplit()(({ splitio }) => {
  // Select a treatment value
  const { treatment, isReady } = selectTreatmentAndStatus(splitio, 'FEATURE_FLAG_NAME')

  // Check SDK client readiness using isReady property
  if (!isReady) return <div>Loading SDK ...</div>;

  if (treatment === 'on') {
    // return JSX for 'on' treatment
  } else if (treatment === 'off') {
    // return JSX for 'off' treatment
  } else {
    // return JSX for 'control' treatment
  }
});

ReactDOM.render(
  <Provider store={store}>
    <MyComponent />
  </Provider>,
  document.getElementById('root')
);
```

Please refer to [our official docs](https://help.split.io/hc/en-us/articles/360038851551-Redux-SDK) to learn about all the functionality provided by our SDK and the configuration options available for tailoring it to your current application setup.

## Submitting issues

The Split team monitors all issues submitted to this [issue tracker](https://github.com/splitio/redux-client/issues). We encourage you to use this issue tracker to submit any bug reports, feedback, and feature enhancements. We'll do our best to respond in a timely manner.

## Contributing
Please see [Contributors Guide](CONTRIBUTORS-GUIDE.md) to find all you need to submit a Pull Request (PR).

## License
Licensed under the Apache License, Version 2.0. See: [Apache License](http://www.apache.org/licenses/).

## About Split

Split is the leading Feature Delivery Platform for engineering teams that want to confidently deploy features as fast as they can develop them. Split’s fine-grained management, real-time monitoring, and data-driven experimentation ensure that new features will improve the customer experience without breaking or degrading performance. Companies like Twilio, Salesforce, GoDaddy and WePay trust Split to power their feature delivery.

To learn more about Split, contact hello@split.io, or get started with feature flags for free at https://www.split.io/signup.

Split has built and maintains SDKs for:

* .NET [Github](https://github.com/splitio/dotnet-client) [Docs](https://help.split.io/hc/en-us/articles/360020240172--NET-SDK)
* Android [Github](https://github.com/splitio/android-client) [Docs](https://help.split.io/hc/en-us/articles/360020343291-Android-SDK)
* Angular [Github](https://github.com/splitio/angular-sdk-plugin) [Docs](https://help.split.io/hc/en-us/articles/6495326064397-Angular-utilities)
* Elixir thin-client [Github](https://github.com/splitio/elixir-thin-client) [Docs](https://help.split.io/hc/en-us/articles/26988707417869-Elixir-Thin-Client-SDK)
* Flutter [Github](https://github.com/splitio/flutter-sdk-plugin) [Docs](https://help.split.io/hc/en-us/articles/8096158017165-Flutter-plugin)
* GO [Github](https://github.com/splitio/go-client) [Docs](https://help.split.io/hc/en-us/articles/360020093652-Go-SDK)
* iOS [Github](https://github.com/splitio/ios-client) [Docs](https://help.split.io/hc/en-us/articles/360020401491-iOS-SDK)
* Java [Github](https://github.com/splitio/java-client) [Docs](https://help.split.io/hc/en-us/articles/360020405151-Java-SDK)
* JavaScript [Github](https://github.com/splitio/javascript-client) [Docs](https://help.split.io/hc/en-us/articles/360020448791-JavaScript-SDK)
* JavaScript for Browser [Github](https://github.com/splitio/javascript-browser-client) [Docs](https://help.split.io/hc/en-us/articles/360058730852-Browser-SDK)
* Node.js [Github](https://github.com/splitio/javascript-client) [Docs](https://help.split.io/hc/en-us/articles/360020564931-Node-js-SDK)
* PHP [Github](https://github.com/splitio/php-client) [Docs](https://help.split.io/hc/en-us/articles/360020350372-PHP-SDK)
* PHP thin-client [Github](https://github.com/splitio/php-thin-client) [Docs](https://help.split.io/hc/en-us/articles/18305128673933-PHP-Thin-Client-SDK)
* Python [Github](https://github.com/splitio/python-client) [Docs](https://help.split.io/hc/en-us/articles/360020359652-Python-SDK)
* React [Github](https://github.com/splitio/react-client) [Docs](https://help.split.io/hc/en-us/articles/360038825091-React-SDK)
* React Native [Github](https://github.com/splitio/react-native-client) [Docs](https://help.split.io/hc/en-us/articles/4406066357901-React-Native-SDK)
* Redux [Github](https://github.com/splitio/redux-client) [Docs](https://help.split.io/hc/en-us/articles/360038851551-Redux-SDK)
* Ruby [Github](https://github.com/splitio/ruby-client) [Docs](https://help.split.io/hc/en-us/articles/360020673251-Ruby-SDK)

For a comprehensive list of open source projects visit our [Github page](https://github.com/splitio?utf8=%E2%9C%93&query=%20only%3Apublic%20).

**Learn more about Split:**

Visit [split.io/product](https://www.split.io/product) for an overview of Split, or visit our documentation at [help.split.io](https://help.split.io) for more detailed information.
