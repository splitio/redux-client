import { thunk } from 'redux-thunk';
import configureMockStore from 'redux-mock-store';

const middlewares: any[] = [thunk];

/**
 * redux-mock-store is designed to test the action-related logic, not the reducer-related one. In other words, it does not update the Redux store.
 * Use storeState.ts for mocks of the Redux store state.
 */
export default configureMockStore(middlewares);
