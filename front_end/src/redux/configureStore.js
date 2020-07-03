import { createStore } from 'redux';

import thunk from 'redux-thunk';
import reducer from './combineReducers';

import { applyExtendedMiddleware, composeWithDevTools } from './redux';

function configureStore(initialState = {}) {
  const middlewareEnhancer = applyExtendedMiddleware(thunk);
  const composedEnhancers = composeWithDevTools(middlewareEnhancer);

  return createStore(reducer, initialState, composedEnhancers);
}

export const store = configureStore();
