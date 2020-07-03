import { compose } from 'redux';

/**
 * This function is used to apply middleware to the store. It's the same as the default redux {@see applyMiddleware} function
 * but this function expands on the middleware api with subscribe.
 *
 * @param   {Array<Middleware>} middlewares - The application's middlewares.
 * @returns {StoreEnhancer}
 */
export const applyExtendedMiddleware = (...middlewares) => {
  return createStore => (...args) => {
    const store = createStore(...args);
    let dispatch = () => {
      throw new Error(
        `Dispatching while constructing your middleware is not allowed. ` +
          `Other middleware would not be applied to this dispatch.`
      );
    };

    const middlewareAPI = {
      getState: store.getState,
      subscribe: store.subscribe,
      dispatch: (...dispatchArgs) => dispatch(...dispatchArgs)
    };

    const chain = middlewares.map(middleware => middleware(middlewareAPI));
    dispatch = compose(...chain)(store.dispatch);

    return {
      ...store,
      dispatch
    };
  };
};

export const composeWithDevTools =
  (window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({ trace: true })) ||
  compose;
