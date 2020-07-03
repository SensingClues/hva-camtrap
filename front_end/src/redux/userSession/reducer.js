import * as types from './types';

const initState = {
  session: {
    pending: false,
    error: null,
    success: null,
    userToken: false
  }
};

export default function (state = initState, action) {
  switch (action.type) {
    case types.LOGIN_PENDING:
      return {
        ...state,
        session: {
          ...state.session,
          pending: true,
          error: null,
          success: null,
          userToken: null
        }
      };

    case types.LOGIN_SUCCESS:
    case types.AUTHENTICATION_SUCCESS:
      return {
        ...state,
        session: {
          ...state.session,
          pending: false,
          error: null,
          success: true,
          userToken: action.userToken
        }
      };

    case types.LOGIN_ERROR:
      return {
        ...state,
        session: {
          ...state.session,
          pending: false,
          error: action.error,
          success: false,
          userToken: null
        }
      };

    default:
      return state;
  }
}
