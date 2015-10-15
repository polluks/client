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

const tabToRootRouteParse = {
  [FOLDER_TAB]: Folders.parseRoute,
  [CHAT_TAB]: Chat.parseRoute,
  [PEOPLE_TAB]: People.parseRoute,
//  [DEVICES_TAB]: Devices.parseRoute,
//  [MORE_TAB]: More.parseRoute
}

export default class Nav extends Base {
  constructor(props) {
    super(props)
  }

  _renderContent (color, activeTab) {
    return (
      <div>
        {React.createElement(
          connect(state => state.tabbedRouter.getIn(['tabs', state.tabbedRouter.get('activeTab')]).toObject())(MetaNavigator),
          {store: this.props.store, rootRouteParser: tabToRootRouteParse[activeTab] || NoTab.parseRoute}
        )}
      </div>
    )
  }

  render () {
    const {dispatch} = this.props
    const activeTab = this.props.tabbedRouter.get('activeTab')

    console.log('in Nav render')
    return (
      <div>
        <ul>
          <li
            title='Folders'
            selected={activeTab === FOLDER_TAB}
            onPress={() => dispatch(switchTab(FOLDER_TAB))}>
            {this._renderContent('#414A8C', FOLDER_TAB)}
          </li>
          <li
            title='Chat'
            selected={activeTab === CHAT_TAB}
            onPress={() => dispatch(switchTab(CHAT_TAB))}>
            {this._renderContent('#417A8C', CHAT_TAB)}
          </li>
          <li
            title='People'
            systemIcon='contacts'
            selected={activeTab === PEOPLE_TAB}
            onPress={() => dispatch(switchTab(PEOPLE_TAB))}>
            {this._renderContent('#214A8C', PEOPLE_TAB)}
          </li>
          <li
            title='Devices'
            selected={activeTab === DEVICES_TAB}
            onPress={() => dispatch(switchTab(DEVICES_TAB))}>
            {this._renderContent('#783E33', DEVICES_TAB)}
          </li>
          <li
            title='more'
            selected={activeTab === MORE_TAB}
            onPress={() => dispatch(switchTab(MORE_TAB))}>
            {this._renderContent('#21551C', MORE_TAB)}
          </li>
        </ul>
      </div>
    )
  }
}
