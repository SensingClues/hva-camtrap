import PropTypes from 'prop-types';
import React, { Component } from 'react';

import * as text from '../../assets/text';

import styles from './styles.module.scss';

/**
 * This class is used to render a navbar at the top of the screen.
 */
export default class NavBar extends Component {
  render() {
    return (
      <nav>
        <ul>
          <li>{text.NAV_PROFILE}</li>
          <li>{text.NAV_HOME}</li>
          {this.renderElements()}
          <li className={styles.left_nav}>
            {text.NAV_TITLE}
            <img
              src="https://images.squarespace-cdn.com/content/5ce7a5b3a523bb00013831f9/1558686018078-Q3AV0T3CEVRY95VYSLTG/image+%281%29.png?content-type=image%2Fpng"
              alt={'Logo'}
            />
          </li>
        </ul>
      </nav>
    );
  }

  /**
   * Puts all added children in an li and renders them.
   */
  renderElements = () => {
    const { children = [] } = this.props;
    return children.map((element, key) => <li key={key}>{element}</li>);
  };
}

/**
 * Makes sure that the data the NavBar receives is valid.
 */
NavBar.propTypes = {
  elements: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.element]))
};
