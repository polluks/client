/* @flow */
'use strict'
// Tab Nav Reducer.
// This expands the router to work on multiple tabs.
// The router works just as before except this layer
// sits on top and dispatches messages to the correct tab's router.

import Immutable from 'immutable'
import routerReducer, { createRouterState } from './router'
import * as TabConstants from '../constants/tabs'
import * as Constants from '../constants/tabbed-router'
// $FlowFixMe ignore this import for now
import * as LocalDebug from '../local-debug'
import * as LoginConstants from '../constants/login2'

import type { RouterState } from './router'

type TabName = TabConstants.startupTab | TabConstants.folderTab | TabConstants.chatTab |
  TabConstants.peopleTab | TabConstants.devicesTab | TabConstants.moreTab
type TabbedRouterState = MapADT2<'tabs', Immutable.Map<TabName, RouterState>, 'activeTab', TabName> // eslint-disable-line no-undef

const emptyRouterState: RouterState = LocalDebug.overrideRouterState ? LocalDebug.overrideRouterState : createRouterState([], [])

const initialState: TabbedRouterState = Immutable.fromJS({
  // a map from tab name to router obj
  tabs: {
    // $FlowIssue flow doesn't support computed keys
    [TabConstants.startupTab]: emptyRouterState,
    // $FlowIssue flow doesn't support computed keys
    [TabConstants.folderTab]: emptyRouterState,
    // $FlowIssue flow doesn't support computed keys
    [TabConstants.chatTab]: emptyRouterState,
    // $FlowIssue flow doesn't support computed keys
    [TabConstants.peopleTab]: emptyRouterState,
    // $FlowIssue flow doesn't support computed keys
    [TabConstants.devicesTab]: emptyRouterState,
    // $FlowIssue flow doesn't support computed keys
    [TabConstants.moreTab]: emptyRouterState
  },
  activeTab: LocalDebug.overrideActiveTab ? LocalDebug.overrideActiveTab : TabConstants.moreTab
})

export default function (state: TabbedRouterState = initialState, action: any): TabbedRouterState {
  switch (action.type) {
    case Constants.switchTab:
      return state.set('activeTab', action.payload)
    case LoginConstants.loginDone:
      if (LocalDebug.skipLoginRouteToRoot) {
        return state
      }
      return state.set('activeTab', TabConstants.folderTab)
    case LoginConstants.logoutDone:
      return state.set('activeTab', TabConstants.startupTab)
    case LoginConstants.needsLogin:
    case LoginConstants.needsRegistering:
      // TODO set the active tab to be STARTUP_TAB here.
      // see: https://github.com/keybase/client/pull/1202#issuecomment-150346720
      return state.set('activeTab', TabConstants.moreTab).updateIn(['tabs', TabConstants.startupTab], (routerState) => routerReducer(routerState, action))
    default:
      return state.updateIn(['tabs', state.get('activeTab')], (routerState) => routerReducer(routerState, action))
  }
}
