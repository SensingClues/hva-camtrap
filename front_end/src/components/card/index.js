import React, { Component } from 'react';

import styles from './styles.module.scss';

/**
 * Use material-ui card styling for own card component.
 */
export default class Card extends Component {
  render() {
    const { children, className } = this.props;
    return <div className={`${styles.card} ${className}`}>{children}</div>;
  }
}
