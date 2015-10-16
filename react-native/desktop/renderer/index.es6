'use strict'
/* @flow */

import {AppBar, Dialog} from 'material-ui';
import Base, { AppRegistry } from '../../../react-native/react/base'
import React from 'react'
import ReactDOM from "react-dom";
import { Provider, connect } from 'react-redux'
import configureStore from '../../../react-native/react/store/configure-store'
import Nav from '../../../react-native/react/nav'
import { DevTools, DebugPanel, LogMonitor } from 'redux-devtools/lib/react'
import Login from '../../../react-native/react/login'
import injectTapEventPlugin from 'react-tap-event-plugin'
const store = configureStore()

class Keybase extends Base {
  constructor () {
    super()
    console.log('in Keybase constructor')
    console.log(DevTools)
    console.log(store)
    injectTapEventPlugin()
  }

  render () {
    console.log('in main render')
    return (
      <div>
        <DebugPanel top right bottom>
          <DevTools store={store} monitor={LogMonitor} visibleOnLoad={true} />
        </DebugPanel>
        <Provider store={store}>
          {() => {
            // TODO(mm): maybe not pass in store?
            return React.createElement(connect(state => state)(Nav), {store: store})
          }}
        </Provider>
      </div>
    )
  }
}

ReactDOM.render(<Keybase/>, document.getElementById('app'))
