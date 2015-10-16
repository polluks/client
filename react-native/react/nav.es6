'use strict'
/* @flow */

import Base from "./base"
import { connect } from 'react-redux'
import MetaNavigator from './router/meta-navigator'
import React from 'react'
import { StyleSheet } from 'react'
import Folders from './tabs/folders'
import Chat from './tabs/chat'
import People from './tabs/people'
//import Devices from './tabs/devices'
import NoTab from './tabs/no-tab'
//import More from './tabs/more'

import {FOLDER_TAB, CHAT_TAB, PEOPLE_TAB, DEVICES_TAB, MORE_TAB} from './constants/tabs'
import { switchTab } from './actions/tabbed-router'
import { LeftNav, AppBar } from 'material-ui'

const tabToRootRouteParse = {
  [FOLDER_TAB]: Folders.parseRoute,
  [CHAT_TAB]: Chat.parseRoute,
  [PEOPLE_TAB]: People.parseRoute,
//  [DEVICES_TAB]: Devices.parseRoute,
//  [MORE_TAB]: More.parseRoute
}

const menuItems = [
  { route: [FOLDER_TAB], text: 'Folders' },
  { route: [CHAT_TAB], text: 'Chat' },
  { route: [PEOPLE_TAB], text: 'People' }
]

export default class Nav extends Base {
  constructor(props) {
    super(props)
  }

  _renderContent (color, activeTab) {
    return (
      <div>
        {React.createElement(
          connect((state) => {
            console.log(state.tabbedRouter)
          },
          {store: this.props.store, rootRouteParser: tabToRootRouteParse[activeTab] || NoTab.parseRoute}
        )}
      </div>
    )
  }

  _onLeftNavChange (e, key, payload) {
    console.log(this.props)
    console.log('should switch to ' + payload.route)
    this.props.dispatch(switchTab(payload.route))
  }

  render () {
    const {dispatch} = this.props
    const activeTab = this.props.tabbedRouter.get('activeTab')
    console.log('in Nav render')
    console.log(dispatch)
    console.log(activeTab)
    return (
      <div>
      <LeftNav ref='leftNav'
        docked={true}
        menuItems={menuItems}
        onChange={(...args) => this._onLeftNavChange(...args)} />
      {this._renderContent('#aaaaaa', activeTab)}
      </div>
    )
  }
}
