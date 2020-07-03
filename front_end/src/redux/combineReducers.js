import { combineReducers } from 'redux';
import { reducer as form } from 'redux-form';

import userSession from './userSession/reducer';
import imageData from './imageData/reducer';

export default combineReducers({ userSession, imageData, form });
