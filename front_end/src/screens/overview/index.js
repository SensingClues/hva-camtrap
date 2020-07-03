import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators, compose } from 'redux';

import { withRouter } from 'react-router-dom';

import { CircularProgress } from '@material-ui/core';
import Checkbox from '@material-ui/core/Checkbox';

import NavBar from '../../components/navbar';

import * as text from '../../assets/text';
import * as imageActions from '../../redux/imageData/actions';

import styles from './styles.module.scss';

/**
 * This screen renders the overview of the portal. It is used to show a list of images wich can
 * be validated by the user.
 */
class Overview extends Component {
  constructor(props) {
    super(props);
    this.state = { hideValidated: false, hideUnvalidated: false, search: '' };
    this.props.actions.getImages();
  }

  render() {
    return (
      <div className={styles.center}>
        <NavBar>
          <label className={styles.checkbox}>
            <Checkbox onChange={this.onCheckboxChange('hideUnvalidated')} color={'primary'} />
            <span>{text.OVERVIEW_HIDE_VALIDATION}</span>
          </label>
          <label className={styles.checkbox}>
            <Checkbox onChange={this.onCheckboxChange('hideValidated')} color={'primary'} />
            <span>{text.OVERVIEW_HIDE_UN_VALIDATED}</span>
          </label>
          <input placeholder={text.OVERVIEW_PLACEHOLDER} className={styles.searchbar} onChange={this.onSearchChange} />
        </NavBar>
        {this.renderOverview()}
      </div>
    );
  }

  /**
   * This function is used to render teh main content of the page. When the data is pending it wil render a
   * spinner instead.
   */
  renderOverview = () => {
    const { pending } = this.props.imageData;

    if (!pending) return <div className={styles.container}>{this.renderOverviewCards()}</div>;

    return (
      <div className={styles.spinner}>
        <CircularProgress />
      </div>
    );
  };

  /**
   * This function is used to render all the individual cards of the system.
   * For each image that is found it will creat a card with its given features.
   */
  renderOverviewCards = () => {
    const { data } = this.props.imageData;
    const { hideValidated, hideUnvalidated, search } = this.state;

    // Filter the images based on the search field and validation settings.
    const filteredData = data.filter(({ isValidated, label }) => {
      if ((hideValidated && !isValidated) || (hideUnvalidated && isValidated)) return false;
      return label.toLowerCase().includes(search.toLowerCase());
    });

    // Loop over the data and construct an image tile based on its values.
    return filteredData.map(({ original, isValidated, label }, key) => (
      <div
        key={key}
        className={styles.flex_item}
        data-is-validated={isValidated}
        onClick={!isValidated && this.navigateToDashboard(key)}>
        <div className={styles.text_block}>
          <span>{label}</span>
        </div>
        <img src={original} alt={label} />
      </div>
    ));
  };

  /**
   * This function is used to update the search param in the store.
   *
   * @param {object} event - The search event given by the text field.
   */
  onSearchChange = event => this.setState({ search: event.target.value });

  /**
   * This function is used to set the checkbox value in the store.
   * A store key can be given to target the correct checkbox storage.
   *
   * @param {string} storeKey - The key name to use in the store.
   */
  onCheckboxChange = storeKey => (event, value) => this.setState({ [storeKey]: value });

  /**
   * This function is used to navigate to the dashboard when a specific card is clicked.
   *
   * @param {number} index - The index of the clicked item.
   */
  navigateToDashboard = index => () => this.props.history.push(`/dashboard/${index}`);
}

const mapStateToProps = state => ({
  imageData: state.imageData.getImages
});

const mapDispatchToProps = dispatch => ({
  actions: bindActionCreators(
    {
      ...imageActions
    },
    dispatch
  )
});

export default compose(connect(mapStateToProps, mapDispatchToProps), withRouter)(Overview);
