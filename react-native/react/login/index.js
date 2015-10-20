'use strict'
/* @flow */

// import React, { Component, Text, StyleSheet, View } from 'react-native'
import React from '../react'
import Base from '../base'
import RenderLoginContainer from './nativeLoginContainer'
import RenderLoginForm from './nativeLoginForm'
//import DevicePrompt from './device-prompt'
//import SelectSigner from './select-signer'
//import DisplaySecretWords from './display-secret-words'
//import LoginForm from './form'

export default class LoginContainer extends Base {
  constructor (props) {
    super(props)
  }

  render () {
    return RenderLoginContainer.apply(this)
  }

  static parseRoute (store, currentPath, nextPath) {
    console.log('in login parseRoute')
    // TODO(mm): maybe these route names can be the constants we are already using?
    // e.g. state.SHOW_SECRET_WORDS
    const routes = {
      'loginform': RenderLoginForm.parseRoute
      // 'device-prompt': DevicePrompt.parseRoute,
      // 'device-signer': SelectSigner.parseRoute,
      // 'show-secret-words': DisplaySecretWords.parseRoute
    }
    console.log(routes)
    // TODO(mm): figure out how this interacts with redux
    const componentAtTop = {
      title: 'Keybase',
      component: LoginContainer,
      saveKey: 'Login',
      leftButtonTitle: '¯\\_(ツ)_/¯',
      mapStateToProps: state => state.login,
      props: {
        onLoggedIn: () => {
          this.showSearch()
        }
      }
    }

    // Default the next route to the login form
    const parseNextRoute = routes[nextPath.get('path')] || RenderLoginForm.parseRoute

    return {
      componentAtTop,
      parseNextRoute
    }
  }

}
/*
LoginContainer.propTypes = {
  onLoggedIn: React.PropTypes.func.isRequired,
  dispatch: React.PropTypes.func.isRequired,
  loginState: React.PropTypes.string.isRequired,
  loggedIn: React.PropTypes.bool.isRequired,
  username: React.PropTypes.string,
  passphrase: React.PropTypes.string,
  storeSecret: React.PropTypes.bool.isRequired,
  deviceName: React.PropTypes.string,
  waitingForServer: React.PropTypes.bool.isRequired,
  response: React.PropTypes.object,
  signers: React.PropTypes.object,
  secretWords: React.PropTypes.string,
  error: React.PropTypes.string
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF'
  }
})
*/
