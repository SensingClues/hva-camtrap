import * as types from './types';

const initState = {
  getImages: {
    data: [],
    pending: false,
    error: null,
    success: null
  }
};

export default function (state = initState, action) {
  switch (action.type) {
    /** This state is used to indicate that the retrieval of the image data is pending. */
    case types.GET_DATA_PENDING:
      return {
        ...state,
        getImages: {
          ...state.getImages,
          pending: true,
          error: null,
          success: null
        }
      };

    /** This state is used to indicate that the retrieval of the image data was successful. */
    case types.GET_DATA_SUCCESS:
      return {
        ...state,
        getImages: {
          ...state.getImages,
          data: action.data,
          pending: false,
          error: null,
          success: true
        }
      };

    /** This state is used to indicate that the retrieval of the image data went wrong. */
    case types.GET_DATA_ERROR:
      return {
        ...state,
        getImages: {
          ...state.getImages,
          pending: false,
          error: action.error,
          success: false
        }
      };

    default:
      return state;
  }
}
