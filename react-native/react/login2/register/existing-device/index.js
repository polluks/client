'use strict'
/* @flow */

import React, {Component} from '../../../base-react'
import Render from './index.render'
import { codePageDeviceRoleExistingPhone, codePageDeviceRoleNewPhone, codePageDeviceRoleExistingComputer, codePageDeviceRoleNewComputer } from '../../../constants/login2'

export default class ExistingDevice extends Component {
  render () {
    let otherDeviceComputer = null
    let otherDevicePhone = null

    switch (this.props.myDeviceRole) {
      case codePageDeviceRoleExistingPhone: // fallthrough
      case codePageDeviceRoleExistingComputer:
        otherDeviceComputer = codePageDeviceRoleNewComputer
        otherDevicePhone = codePageDeviceRoleNewPhone
        break
      case codePageDeviceRoleNewPhone: // fallthrough
      case codePageDeviceRoleNewComputer:
        otherDeviceComputer = codePageDeviceRoleExistingComputer
        otherDevicePhone = codePageDeviceRoleExistingPhone
        break
    }

    return (
      <Render
        onSubmitComputer={() => this.props.onSubmit(otherDeviceComputer)}
        onSubmitPhone={() => this.props.onSubmit(otherDevicePhone)}
      />
    )
  }
}

ExistingDevice.propTypes = {
  myDeviceRole: React.PropTypes.oneOf([
    codePageDeviceRoleExistingPhone,
    codePageDeviceRoleNewPhone,
    codePageDeviceRoleExistingComputer,
    codePageDeviceRoleNewComputer
  ]),
  onSubmit: React.PropTypes.func.isRequired
}
