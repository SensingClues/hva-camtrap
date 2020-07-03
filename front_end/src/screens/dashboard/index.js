import React, { Component } from 'react';

import { connect } from 'react-redux';
import { Field, Form, reduxForm } from 'redux-form';
import { bindActionCreators, compose } from 'redux';

import { FormControlLabel } from '@material-ui/core';

import Card from '@material-ui/core/Card';
import Button from '@material-ui/core/Button';
import Checkbox from '@material-ui/core/Checkbox';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';

import QuestionField from '../../components/questionField';

import { navigation } from '../../constants/navigation';
import { forms, imageForm } from '../../constants/form';

import * as text from '../../assets/text';
import * as imageActions from '../../redux/imageData/actions';

import styles from './styles.module.scss';

/**
 * This screen is used to show a detailed overview of a selected card.
 * Per image it will render all the form options and screens for the cropped animals.
 */
class Dashboard extends Component {
  constructor(props) {
    super(props);

    this.state = { currentPage: 1 };

    // When reloading the page retrieve the data on initialization.
    const { data } = this.props.imageData;
    if (!data || data.length <= 0) this.props.actions.getImages();
  }

  render() {
    const { currentPage } = this.state;
    const { data } = this.props.imageData;
    const { index } = this.props.match.params;

    // Do not render the page when no data is available. This is to prevent crashes when initializing.
    if (!data || data.length <= 0) return null;

    const { original, animals } = data[index];
    const { image, predictions: values } = animals[currentPage - 1];

    // Load all the predictions including the static answers.
    const predictions = [...values, 'No animal visible', 'Other'];

    return (
      <Form className={styles.container} onSubmit={this.props.handleSubmit(this.onSubmit)}>
        <div>
          <div className={styles.imageContainer}>
            <div>
              <span>{text.DASHBOARD_IMAGE_ORIGINAL}</span>
              <img src={original} />
            </div>
            <div>
              <span>{text.DASHBOARD_IMAGE_FOUND_ANIMAL}</span>
              <img src={image} />
            </div>
          </div>
          <div className={styles.formContainer}>
            <div>{this.renderPredictions(predictions)}</div>
          </div>
          <Field hidden name={`selection_${currentPage}`} component={() => <div />} />
          {this.renderMenuButtons()}
        </div>
      </Form>
    );
  }

  /** @param {Array} predictions - The predictions made for the current image.  */
  renderPredictions = predictions =>
    predictions.map((prediction, key) => {
      const { currentPage } = this.state;

      const selected = this.props.formData.values[`selection_${currentPage}`];
      const isOpen = selected === prediction;

      const isLast = predictions.length - 1 === key;

      return (
        <ExpansionPanel expanded={isOpen} key={key}>
          <ExpansionPanelSummary>
            <FormControlLabel
              control={<Checkbox onChange={this.expandPanel(prediction, currentPage)} checked={isOpen} />}
              label={prediction}
            />
          </ExpansionPanelSummary>
          {isLast && this.renderMenu()}
        </ExpansionPanel>
      );
    });

  renderMenu = () => (
    <ExpansionPanelDetails className={styles.panelDetails}>
      <p>{text.DASHBOARD_VERIFICATION_CARD}</p>
      <span>{text.DASHBOARD_VERIFICATION_DESCRIPTION}</span>
      <QuestionField fields={imageForm} pageNum={this.state.currentPage} />
    </ExpansionPanelDetails>
  );

  /**
   * This function is used to render the navigation buttons at the bottom of the screen.
   * They are used to navigate to the previous and next animals that are found.
   * It will also render a submit button that will trigger the submit request for redux form. This button is only
   * enabled when all the animals are validated.
   */
  renderMenuButtons = () => {
    const { currentPage } = this.state;
    const { animals } = this.props.imageData.data[this.props.match.params.index];

    const lastPage = currentPage < animals.length;
    const hasSelection = !!this.props.formData.values[`selection_${currentPage}`];

    return (
      <Card className={styles.controlButtons}>
        <div className={styles.stepper}>{this.renderSteps()}</div>
        <div>
          <Button disabled={currentPage === 1} onClick={this.setPage(-1)}>
            {text.PREVIOUS}
          </Button>
          <Button disabled={!lastPage || !hasSelection} onClick={this.setPage(+1)}>
            {text.NEXT}
          </Button>
          <Button color={'primary'} disabled={lastPage || !hasSelection} type={'submit'}>
            {text.SUBMIT}
          </Button>
        </div>
      </Card>
    );
  };

  /**
   * This function is used to update the selection field in redux form.
   * It is used to update which panel is active.
   *
   * @param {string} value       - The key name of the expansion panel.
   * @param {number} currentPage - The page wich is currently selected.
   */
  expandPanel = (value, currentPage) => () => this.props.change(`selection_${currentPage}`, value);

  /**
   * This function is used to set the selected page.
   * It can be used to increase or decrease the current page num, or it can be used to directly set the given page.
   *
   * @param {number}  page   - The offset amount or page num to select.
   * @param {boolean} offset - If the function should operate in offset or in direct set modes. (defaults of offset).
   */
  setPage = (page, offset = true) => () =>
    this.setState({ currentPage: offset ? this.state.currentPage + page : page });

  /**
   * This function is used to render all the steps at the bottom of the page.
   * For each image that should be validated it renders a corresponding step.
   */
  renderSteps = () => {
    const { currentPage } = this.state;
    const { animals } = this.props.imageData.data[this.props.match.params.index];

    return animals.map((_, key) => {
      const page = key + 1;
      const isActive = currentPage >= page;

      return (
        <>
          {key !== 0 ? <span data-active={isActive} /> : null}
          <div key={key} data-active={isActive} onClick={this.setPage(page, false)}>
            {page}
          </div>
        </>
      );
    });
  };

  /**
   * This function is used to submit the values that are entered in the form.
   * It will collect the data, retrieve the folder that is corresponds with and then submit it.
   * After submission it will redirect back to the overview page.
   *
   * @param {object} formValues - The values entered in the form.
   */
  onSubmit = formValues => {
    const { index } = this.props.match.params;
    const { data } = this.props.imageData;
    const { folder } = data[index];

    // Submit the values and navigate back.
    this.props.actions.submitImageData(formValues, folder);
    this.props.history.push(navigation.OVERVIEW.path);
  };
}

const mapStateToProps = state => ({
  imageData: state.imageData.getImages,
  formData: state.form[forms.PREDICTION_FORM] || { values: {} }
});

const mapDispatchToProps = dispatch => ({
  actions: bindActionCreators(
    {
      ...imageActions
    },
    dispatch
  )
});

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  reduxForm({
    initialValues: {},
    enableReinitialize: true,
    form: forms.PREDICTION_FORM
  })
)(Dashboard);
