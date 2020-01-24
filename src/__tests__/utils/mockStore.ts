import thunk from 'redux-thunk';
import configureMockStore from 'redux-mock-store';
const middlewares = [thunk];

/**
 * Utils to not call requires files every time that we need mock the store
 */
export default configureMockStore(middlewares);
