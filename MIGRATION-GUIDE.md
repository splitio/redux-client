
# Migrating to Redux SDK v2.0.0

Redux SDK v2.0.0 introduces a breaking change that you should consider when migrating from a previous version.

If you were passing the `core.trafficType` option to the SDK configuration object, you should remove it since it is no longer supported.
The `trafficType` must be passed as an argument of the `track` helper function. For example:

```js
import { initSplitSdk, track } from '@splitsoftware/splitio-redux'

const CONFIG = {
  core: {
    authorizationKey: YOUR_CLIENT_SIDE_SDK_KEY,
    key: USER_KEY,
    trafficType: 'user'
  }
}

store.dispatch(initSplitSdk({ config: CONFIG }))

track({ eventType: 'my_event' });
```

should be refactored to:

```js
import { initSplitSdk, track } from '@splitsoftware/splitio-redux'

const CONFIG = {
  core: {
    authorizationKey: YOUR_CLIENT_SIDE_SDK_KEY,
    key: USER_KEY
  }
}

store.dispatch(initSplitSdk({ config: CONFIG }))

track({ eventType: 'my_event', trafficType: 'user' });
```
