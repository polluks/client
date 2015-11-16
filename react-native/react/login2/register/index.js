'use strict'
/* @flow */

import React, { Component } from '../../base-react'
import { registerWithUserPass, registerWithPaperKey, registerWithExistingDevice } from '../../actions/login2'
import Render from './index.render'

export default class Register extends Component {
  render () {
    return (
      <Render
        onGotoExistingDevicePage={() => this.props.dispatch(registerWithExistingDevice())}
        onGotoPaperKeyPage={() => this.props.dispatch(registerWithPaperKey())}
        onGotoUserPassPage={() => this.props.dispatch(registerWithUserPass())}
      />
    )
  }

  static parseRoute (store, currentPath, nextPath) {
    return { componentAtTop: {} }
  }
}

Register.propTypes = {
  dispatch: React.PropTypes.func.isRequired
}
