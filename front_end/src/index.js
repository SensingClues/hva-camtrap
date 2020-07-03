import React, { Component } from 'react';
import ReactDOM from 'react-dom';

import { BrowserRouter } from 'react-router-dom';

import { Provider } from 'react-redux';
import { store } from './redux/configureStore';

import Router from './router';

import styles from './styles.module.scss';

/**
 * This is the main class of the portal.
 * From here the main routes are loaded and the base connections are made with react router and redux.
 */
class App extends Component {
  render() {
    return (
      <BrowserRouter>
        <Provider store={store}>
          <div className={styles.background}>
            <img src={'https://sensingcluesfoundation.files.wordpress.com/2017/09/zebra-2332997_1920.jpg'} />
          </div>
          <div className={styles.mainContainer}>
            <Router />
          </div>
        </Provider>
      </BrowserRouter>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('root'));
