import * as types from './types';

/**
 * Set userToken in sessionStorage and login.
 *
 * @param {string} username - The user name.
 * @param {string} password - The password.
 */
export const authenticate = (username, password) => async dispatch => {
  dispatch({ type: types.LOGIN_PENDING });

  try {
    const result = await login(username, password);
    const userToken = await result.json();

    if (userToken.error) return dispatch({ type: types.LOGIN_ERROR, error: userToken.message });

    sessionStorage.setItem('userToken', JSON.stringify(userToken));
    dispatch({ type: types.LOGIN_SUCCESS, userToken });
  } catch (error) {
    dispatch({ type: types.LOGIN_ERROR, error });
  }
};

/**
 * Check if userToken exists.
 */
export const initialize = () => async dispatch => {
  const userToken = sessionStorage.getItem('userToken');
  if (userToken) dispatch({ type: types.AUTHENTICATION_SUCCESS, userToken: JSON.parse(userToken) });
};

/**
 * API request to ftp for login.
 *
 * @param {string} username - The user name.
 * @param {string} password - The password.
 */
const login = async (username, password) => {
  const myHeaders = new Headers();
  myHeaders.append('Content-Type', 'application/x-www-form-urlencoded');

  const urlencoded = new URLSearchParams();
  urlencoded.append('username', username);
  urlencoded.append('password', password);
  urlencoded.append('scope', 'upload download list delete');
  urlencoded.append('client_id', 'a9467c4ae808fb8522e44b8e79a1ca85');
  urlencoded.append('client_secret', 'dLyEGsMHZouOousVEhPzjmDtRTvzqxTlT8UOF5y5');
  urlencoded.append('redirect_uri', 'http://localhost');
  urlencoded.append('grant_type', 'password');

  const requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: urlencoded,
    redirect: 'follow'
  };

  return fetch(`/oauth2/token/`, requestOptions);
};
