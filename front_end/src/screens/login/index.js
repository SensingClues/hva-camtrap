import React, { Component } from 'react';

import { connect } from 'react-redux';
import { Card } from '@material-ui/core';
import { Field, Form, reduxForm } from 'redux-form';
import { bindActionCreators, compose } from 'redux';

import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import CircularProgress from '@material-ui/core/CircularProgress';

import FAVICON from '../../assets/images/favicon.ico';

import * as text from '../../assets/text';
import * as userActions from '../../redux/userSession/actions';

import styles from './styles.module.scss';

class Login extends Component {
  componentDidMount() {
    this.props.actions.initialize();
  }

  render() {
    const { pending, error } = this.props.session.session;

    return (
      <Form className={styles.container} onSubmit={this.props.handleSubmit(this.onSubmit)}>
        <div>
          <Card className={styles.login}>
            <p> {text.LOGIN_BUTTON}</p>
            <img src={FAVICON} />
            <div className={styles.inputFields}>
              <Field name={'Username'} component={this.renderTextField} label={text.LOGIN_USERNAME} error={error} />
              <Field
                error={error}
                name={'Password'}
                type={'password'}
                label={text.LOGIN_PASSWORD}
                component={this.renderTextField}
              />
            </div>
            <span>{error}</span>
            <div className={styles.button}>
              <Button type={'submit'} variant={'contained'} color={'primary'} disabled={pending}>
                {!pending ? text.LOGIN_BUTTON : <CircularProgress />}
              </Button>
            </div>
          </Card>
        </div>
      </Form>
    );
  }

  renderTextField = ({ input, label, meta: { touched, error }, ...custom }) => (
    <TextField label={label} errorText={touched && error} {...input} {...custom} required />
  );

  onSubmit = formValues => {
    const { Username, Password } = formValues;
    this.props.actions.authenticate(Username, Password);
  };
}

const mapStateToProps = state => ({
  session: state.userSession
});

const mapDispatchToProps = dispatch => ({
  actions: bindActionCreators(
    {
      ...userActions
    },
    dispatch
  )
});

export default compose(connect(mapStateToProps, mapDispatchToProps), reduxForm({ form: 'login' }))(Login);
