import PropTypes from 'prop-types';
import React, { Component } from 'react';

import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import Checkbox from '@material-ui/core/Checkbox';
import { FormControlLabel } from '@material-ui/core';

import { Field, FormSection } from 'redux-form';

import styles from './styles.module.scss';

/**
 * This class is used to render a question field for redux from.
 * Based ont the given items it will render form components in a given format.
 */
export default class QuestionField extends Component {
  render() {
    return (
      <div className={styles.container}>
        <FormSection name={this.props.pageNum}>
          <this.RenderItems />
        </FormSection>
      </div>
    );
  }

  /**
   * This function is used to render the different field types.
   * For each field that is provided this function will create a redux from field component.
   */
  RenderItems = () =>
    this.props.fields.map(item => {
      const { type, name, label, menuItems } = item;

      // Create a function that wraps the custom components in a redux form field.
      const renderInput = component => <Field key={name} name={name} label={label} component={component} />;

      switch (type) {
        case 'Dropdown':
          return renderInput(this.renderDropdown(menuItems));
        case 'Checkbox':
          return renderInput(this.renderCheckbox);
        default:
          return null;
      }
    });

  /**
   * This function is used to render a dropdown component.
   * The items that is should display are provided first.
   * After that a function is returned which expects the redux from control props.
   *
   * @param   {Array} menuItems         - The items to display in the dropdown.
   * @param   {Array} menuItems[].label - The label to display for the item.
   * @param   {Array} menuItems[].key   - The key name of the item.
   */
  renderDropdown = menuItems => ({ input, label: menuLabel }) => (
    <FormControlLabel
      label={menuLabel}
      labelPlacement={'top'}
      className={styles.labelStyle}
      control={
        <Select onChange={input.onChange} label={menuLabel} value={input.value}>
          {menuItems.map(({ key, label }) => (
            <MenuItem key={key} value={key}>
              {label}
            </MenuItem>
          ))}
        </Select>
      }
    />
  );

  /**
   * This function is used to render a checkbox field.
   *
   * @param {object} props       - The redux form control props.
   * @param {object} props.input - The redux from input control.
   * @param {string} props.label - The label provided by redux form.
   */
  renderCheckbox = ({ input, label }) => (
    <FormControlLabel
      label={label}
      labelPlacement={'top'}
      className={styles.labelStyle}
      control={
        <Checkbox
          name={input.name}
          color={'primary'}
          checked={!!input.value}
          onChange={event => input.onChange(event.target.checked)}
        />
      }
    />
  );
}

QuestionField.propTypes = {
  pageNum: PropTypes.number
};

QuestionField.defaultProps = {
  pageNum: 0
};
