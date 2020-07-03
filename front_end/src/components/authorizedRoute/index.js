import PropTypes from 'prop-types';
import React from 'react';

import { Redirect } from 'react-router-dom';
import { navigation } from '../../constants/navigation';

/**
 * This component is used to wrap components in an authentication shell.
 * When the user is not authenticated, this class will always redirect back to root.
 * Otherwise the children will be made available.
 *
 * @param {object}  props              - The component props.
 * @param {boolean} props.isAuthorized - Indicates if the user is authorized to navigate to this route.
 * @param {Array}   props.children     - The children to render.
 */
const AuthorizedRoute = ({ isAuthorized, children }) => (!isAuthorized ? <Redirect to={navigation.ROOT} /> : children);

AuthorizedRoute.propTypes = {
  isAuthorized: PropTypes.bool
};

export default AuthorizedRoute;
