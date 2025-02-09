'use strict'
/* @flow */

import React, { Component } from '../../react-native/react/base-react'
import ReactDOM from 'react-dom'
import { Provider, connect } from 'react-redux'
import configureStore from '../../react-native/react/store/configure-store'
import Nav from '../../react-native/react/nav'
import { DevTools, DebugPanel, LogMonitor } from 'redux-devtools/lib/react'
import injectTapEventPlugin from 'react-tap-event-plugin'
const store = configureStore()

class Keybase extends Component {
  constructor () {
    super()

    // Used by material-ui widgets.
    injectTapEventPlugin()
  }

  render () {
    return (
      <div>
        <DebugPanel top right bottom>
          <DevTools store={store} monitor={LogMonitor} visibleOnLoad/>
        </DebugPanel>
        <Provider store={store}>
        {React.createElement(connect(state => state)(Nav), {store: store})}
        </Provider>
      </div>
    )
  }
}

ReactDOM.render(<Keybase/>, document.getElementById('app'))
