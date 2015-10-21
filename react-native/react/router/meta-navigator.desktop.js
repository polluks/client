'use strict'
/**
 * @providesModule Meta Navigator
 * A Meta navigator for handling different navigators at the top level.
 * todo(mm) explain why we need a meta navigator
 */

import BaseComponent from '../base-component'
import React from '../base-react'
import { connect } from '../base-redux'
import Immutable from 'immutable'
import MetaNavigatorMobile from './meta-navigator.ios.js'

class MetaNavigator extends MetaNavigatorMobile {
  render () {
    const { store, rootComponent, uri, NavBar, Navigator } = this.props
    let {componentAtTop, routeStack} = this.getComponentAtTop(rootComponent, store, uri)

    return React.createElement(connect(componentAtTop.mapStateToProps || (state => state))(componentAtTop.component), {...componentAtTop.props})
  }
}

MetaNavigator.propTypes = MetaNavigatorMobile.propTypes

export default MetaNavigator
