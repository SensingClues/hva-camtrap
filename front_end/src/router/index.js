import React, { Component } from 'react';

import { connect } from 'react-redux';
import { Redirect, Route, Switch } from 'react-router-dom';

import Login from '../screens/login';
import Overview from '../screens/overview';
import Dashboard from '../screens/dashboard';
import AuthorizedRoute from '../components/authorizedRoute';

import { navigation } from '../constants/navigation';

/**
 * This class is used to render the different routes in the portal.
 * It load the main login route and checks for user authentication. Wraps the main routes in an authorizer so that
 * these routes only load wehn the user is logged in.
 */
class Router extends Component {
  render() {
    const { userToken } = this.props;

    return (
      <Switch>
        <Route path={navigation.ROOT.path} component={this.login} exact />
        <AuthorizedRoute isAuthorized={!!userToken}>
          <Switch>
            <Route path={navigation.OVERVIEW.path} component={Overview} exact />
            <Route path={`${navigation.DASHBOARD.path}/:index`} component={Dashboard} exact />
          </Switch>
        </AuthorizedRoute>
      </Switch>
    );
  }

  login = () => (this.props.userToken ? <Redirect to={navigation.OVERVIEW.path} /> : <Login />);
}

const mapStateToProps = state => ({
  userToken: state.userSession.session.userToken
});

export default connect(mapStateToProps)(Router);
