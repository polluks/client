'use strict'

import * as Constants from '../constants/login2'
import {isMobile} from '../constants/platform'
import QRCodeGen from 'qrcode-generator'
import {navigateTo, routeAppend, getCurrentURI, getCurrentTab} from './router'
import engine from '../engine'
import enums from '../keybase_v1'
import UserPass from '../login2/register/user-pass'
import PaperKey from '../login2/register/paper-key'
import CodePage from '../login2/register/code-page'
import ExistingDevice from '../login2/register/existing-device'
import SetPublicName from '../login2/register/set-public-name'
import {switchTab} from './tabbed-router'
import {devicesTab} from '../constants/tabs'
import {loadDevices} from './devices'

export function login () {
  return (dispatch, getState) => {
    startLoginFlow(dispatch, getState, enums.provisionUi.ProvisionMethod.device, 'Keybase username', 'lorem ipsum', Constants.loginDone)
  }
}

export function doneRegistering () {
  return {
    type: Constants.doneRegistering
  }
}

function defaultModeForDeviceRoles (myDeviceRole, otherDeviceRole, brokenMode) {
  switch (myDeviceRole + otherDeviceRole) {
    case Constants.codePageDeviceRoleExistingComputer + Constants.codePageDeviceRoleNewComputer:
      return Constants.codePageModeEnterText
    case Constants.codePageDeviceRoleNewComputer + Constants.codePageDeviceRoleExistingComputer:
      return Constants.codePageModeShowText

    case Constants.codePageDeviceRoleExistingComputer + Constants.codePageDeviceRoleNewPhone:
      return Constants.codePageModeShowCode
    case Constants.codePageDeviceRoleNewPhone + Constants.codePageDeviceRoleExistingComputer:
      return Constants.codePageModeScanCode

    case Constants.codePageDeviceRoleExistingPhone + Constants.codePageDeviceRoleNewComputer:
      return Constants.codePageModeScanCode
    case Constants.codePageDeviceRoleNewComputer + Constants.codePageDeviceRoleExistingPhone:
      return Constants.codePageModeShowCodeOrEnterText

    case Constants.codePageDeviceRoleExistingPhone + Constants.codePageDeviceRoleNewPhone:
      return brokenMode ? Constants.codePageModeShowText : Constants.codePageModeShowCode
    case Constants.codePageDeviceRoleNewPhone + Constants.codePageDeviceRoleExistingPhone:
      return brokenMode ? Constants.codePageModeEnterText : Constants.codePageModeScanCode
  }
  return null
}

function setCodePageOtherDeviceRole (otherDeviceRole) {
  return (dispatch, getState) => {
    const store = getState().login2.codePage
    dispatch(setCodePageMode(defaultModeForDeviceRoles(store.myDeviceRole, otherDeviceRole, false)))
    dispatch({
      type: Constants.setOtherDeviceCodeState,
      payload: otherDeviceRole
    })
  }
}

function generateQRCode (dispatch, getState) {
  const store = getState().login2.codePage

  const goodMode = store.mode === Constants.codePageModeShowCode || store.mode === Constants.codePageModeShowCodeOrEnterText

  if (goodMode && !store.qrCode && store.textCode) {
    dispatch({
      type: Constants.setQRCode,
      payload: qrGenerate(store.textCode)
    })
  }
}

function setCodePageMode (mode) {
  return (dispatch, getState) => {
    const store = getState().login2.codePage

    generateQRCode(dispatch, getState)

    if (store.mode === mode) {
      return // already in this mode
    }

    dispatch({
      type: Constants.setCodeMode,
      payload: mode
    })
  }
}

function qrGenerate (code) {
  const qr = QRCodeGen(4, 'L')
  qr.addData(code)
  qr.make()
  let tag = qr.createImgTag(10)
  const [ , src, , ] = tag.split(' ')
  const [ , qrCode ] = src.split('\"')
  return qrCode
}

function setCameraBrokenMode (broken) {
  return (dispatch, getState) => {
    dispatch({
      type: Constants.cameraBrokenMode,
      payload: broken
    })

    const root = getState().login2.codePage
    dispatch(setCodePageMode(defaultModeForDeviceRoles(root.myDeviceRole, root.otherDeviceRole, broken)))
  }
}

export function updateForgotPasswordEmail (email) {
  return {
    type: Constants.actionUpdateForgotPasswordEmailAddress,
    payload: email
  }
}

export function submitForgotPassword () {
  return (dispatch, getState) => {
    dispatch({
      type: Constants.actionSetForgotPasswordSubmitting
    })

    engine.rpc('login.recoverAccountFromEmailAddress', {email: getState().login2.forgotPasswordEmailAddress}, {}, (error, response) => {
      dispatch({
        type: Constants.actionForgotPasswordDone,
        payload: error,
        error: !!error
      })
    })
  }
}

export function autoLogin () {
  return dispatch => {
    engine.rpc('login.login', {}, {}, (error, status) => {
      if (error) {
        console.log(error)
      } else {
        dispatch({
          type: Constants.loginDone,
          payload: status
        })
      }
    })
  }
}

export function logout () {
  return dispatch => {
    engine.rpc('login.logout', {}, {}, (error, response) => {
      if (error) {
        console.log(error)
      } else {
        dispatch({
          type: Constants.logoutDone
        })
      }
    })
  }
}

// Show a user/pass screen, call cb() when done
// title/subTitle to customize the screen
function askForUserPass (title, subTitle, cb) {
  return dispatch => {
    const props = {
      title,
      subTitle,
      onSubmit: (username, passphrase) => {
        dispatch({
          type: Constants.actionSetUserPass,
          payload: {
            username,
            passphrase
          }
        })

        cb()
      }
    }

    dispatch(routeAppend({
      parseRoute: {
        componentAtTop: {
          component: UserPass,
          mapStateToProps: state => state.login2.userPass,
          props
        }
      }
    }))
  }
}

function askForPaperKey (cb) {
  return dispatch => {
    const props = {
      onSubmit: paperKey => {
        cb(paperKey)
      }
    }

    dispatch(routeAppend({
      parseRoute: {
        componentAtTop: {
          component: PaperKey,
          mapStateToProps: state => state.login2,
          props
        }
      }
    }))
  }
}

// Show a device naming page, call cb() when done
// existing devices are blacklisted
function askForDeviceName (existingDevices, cb) {
  return dispatch => {
    dispatch({
      type: Constants.actionAskDeviceName,
      payload: {
        existingDevices,
        onSubmit: deviceName => {
          dispatch({
            type: Constants.actionSetDeviceName,
            payload: deviceName
          })

          cb()
        }
      }
    })

    dispatch(routeAppend({
      parseRoute: {
        componentAtTop: {
          component: SetPublicName,
          mapStateToProps: state => state.login2.deviceName
        }
      }
    }))
  }
}

function askForOtherDeviceType (cb) {
  return dispatch => {
    const props = {
      onSubmit: otherDeviceRole => {
        cb(otherDeviceRole)
      }
    }

    dispatch(routeAppend({
      parseRoute: {
        componentAtTop: {
          component: ExistingDevice,
          mapStateToProps: state => state.login2.codePage,
          props
        }
      }
    }))
  }
}

function askForCodePage (cb) {
  return dispatch => {
    const props = {
      setCodePageMode: mode => dispatch(setCodePageMode(mode)),
      qrScanned: code => cb(code.data),
      setCameraBrokenMode: broken => dispatch(setCameraBrokenMode(broken)),
      textEntered: text => cb(text),
      doneRegistering: () => dispatch(doneRegistering())
    }

    const mapStateToProps = state => {
      const {
        mode, codeCountDown, textCode, qrCode,
        myDeviceRole, otherDeviceRole, cameraBrokenMode } = state.login2.codePage
      return {
        mode,
        codeCountDown,
        textCode,
        qrCode,
        myDeviceRole,
        otherDeviceRole,
        cameraBrokenMode
      }
    }

    dispatch(routeAppend({
      parseRoute: {
        componentAtTop: {
          component: CodePage,
          mapStateToProps,
          props
        }
      }
    }))
  }
}

export function registerWithExistingDevice () {
  return (dispatch, getState) => {
    const provisionMethod = enums.provisionUi.ProvisionMethod.device
    startLoginFlow(dispatch, getState, provisionMethod, null, null, Constants.actionRegisteredWithExistingDevice)
  }
}

export function registerWithUserPass () {
  return (dispatch, getState) => {
    const title = 'Registering with your Keybase passphrase'
    const subTitle = 'lorem ipsum lorem ipsumlorem ipsumlorem ipsumlorem ipsumlorem ipsumlorem ipsumlorem ipsumlorem ipsum'
    const provisionMethod = enums.provisionUi.ProvisionMethod.passphrase
    startLoginFlow(dispatch, getState, provisionMethod, title, subTitle, Constants.actionRegisteredWithUserPass)
  }
}

export function registerWithPaperKey () {
  return (dispatch, getState) => {
    const title = 'Registering with your paperkey requires your username'
    const subTitle = 'Different lorem ipsum lorem ipsumlorem ipsumlorem ipsumlorem ipsumlorem ipsumlorem ipsumlorem ipsumlorem ipsum'
    const provisionMethod = enums.provisionUi.ProvisionMethod.paperKey
    startLoginFlow(dispatch, getState, provisionMethod, title, subTitle, Constants.actionRegisteredWithPaperKey)
  }
}

function startLoginFlow (dispatch, getState, provisionMethod, userPassTitle, userPassSubtitle, successType) {
  const deviceType = isMobile ? 'mobile' : 'desktop'
  const incomingMap = makeKex2IncomingMap(dispatch, getState, provisionMethod, userPassTitle, userPassSubtitle)

  engine.rpc('login.login', {deviceType}, incomingMap, (error, response) => {
    dispatch({
      type: successType,
      error: !!error,
      payload: error || null
    })

    if (!error) {
      dispatch(navigateTo([]))
      dispatch(switchTab(devicesTab))
    }
  })
}

export function addANewDevice () {
  return (dispatch, getState) => {
    const provisionMethod = enums.provisionUi.ProvisionMethod.device
    const userPassTitle = 'Registering a new device requires your Keybase username and passphrase'
    const userPassSubtitle = 'reggy lorem ipsum lorem ipsumlorem ipsumlorem ipsumlorem ipsumlorem ipsumlorem ipsumlorem ipsumlorem ipsum'
    const incomingMap = makeKex2IncomingMap(dispatch, getState, provisionMethod, userPassTitle, userPassSubtitle)

    engine.rpc('device.deviceAdd', {}, incomingMap, (error, response) => {
      console.log(error)
    })
  }
}

function makeKex2IncomingMap (dispatch, getState, provisionMethod, userPassTitle, userPassSubtitle) {
  return {
    'keybase.1.provisionUi.chooseProvisioningMethod': (param, response) => {
      response.result(provisionMethod)
    },
    'keybase.1.loginUi.getEmailOrUsername': (param, response) => {
      const { username } = getState().login2.userPass
      if (!username) {
        dispatch(askForUserPass(userPassTitle, userPassSubtitle, () => {
          const { username } = getState().login2.userPass
          response.result(username)
        }))
      } else {
        response.result(username)
      }
    },
    'keybase.1.secretUi.getPaperKeyPassphrase': (param, response) => {
      dispatch(askForPaperKey(paperKey => {
        response.result(paperKey)
      }))
    },
    'keybase.1.secretUi.getKeybasePassphrase': (param, response) => {
      const { passphrase } = getState().login2.userPass
      if (!passphrase) {
        dispatch(askForUserPass(userPassTitle, userPassSubtitle, () => {
          const { passphrase } = getState().login2.userPass
          response.result({
            passphrase,
            storeSecret: false
          })
        }))
      } else {
        response.result({
          passphrase,
          storeSecret: false
        })
      }
    },
    'keybase.1.secretUi.getSecret': (param, response) => {
      const { passphrase } = getState().login2.userPass
      if (!passphrase) {
        dispatch(askForUserPass(userPassTitle, userPassSubtitle, () => {
          const { passphrase } = getState().login2.userPass
          response.result({
            text: passphrase,
            canceled: false,
            storeSecret: true
          })
        }))
      } else {
        response.result({
          text: passphrase,
          canceled: false,
          storeSecret: true
        })
      }
    },
    'keybase.1.provisionUi.PromptNewDeviceName': (param, response) => {
      const { existingDevices } = param
      dispatch(askForDeviceName(existingDevices, () => {
        const { deviceName } = getState().login2.deviceName
        response.result(deviceName)
      }))
    },
    'keybase.1.logUi.log': (param, response) => {
      console.log(param)
      response.result()
    },
    'keybase.1.provisionUi.ProvisioneeSuccess': (param, response) => {
      response.result()
    },
    'keybase.1.provisionUi.ProvisionerSuccess': (param, response) => {
      response.result()
      const uri = getCurrentURI(getState()).last()

      const onDevicesTab = getCurrentTab(getState()) === devicesTab
      const onCodePage = uri && uri.getIn(['parseRoute']) &&
        uri.getIn(['parseRoute']).componentAtTop && uri.getIn(['parseRoute']).componentAtTop.component === CodePage

      if (onDevicesTab && onCodePage) {
        dispatch(navigateTo([]))
        dispatch(loadDevices())
      }
    },
    'keybase.1.provisionUi.chooseDeviceType': (param, response) => {
      dispatch(askForOtherDeviceType(type => {
        const typeMap = {
          [Constants.codePageDeviceRoleExistingPhone]: enums.provisionUi.DeviceType.mobile,
          [Constants.codePageDeviceRoleExistingComputer]: enums.provisionUi.DeviceType.desktop
        }

        dispatch(setCodePageOtherDeviceRole(type))
        response.result(typeMap[type])
      }))
    },
    'keybase.1.provisionUi.DisplayAndPromptSecret': ({phrase, secret}, response) => {
      dispatch({
        type: Constants.setTextCode,
        payload: phrase
      })

      generateQRCode(dispatch, getState)

      dispatch(askForCodePage(phrase => {
        response.result({phrase})
      }))
    },
    'keybase.1.provisionUi.DisplaySecretExchanged': (param, response) => {
      response.result()
    }
  }
}

