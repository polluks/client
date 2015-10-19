'use strict'

import React, { Component } from 'react'
//import commonStyles from '../../styles/common'
import * as LoginActions from '../../actions/login'
import * as SearchActions from '../../actions/search'
import { navigateTo } from '../../actions/router'
import { pushNewProfile } from '../../actions/profile'
//import Button from '../../common-adapters/button'

export default class More extends Component {
  constructor (props) {
    super(props)
  }

  componentWillMount () {
    this.state = [
      {name: 'Login', onClick: () => {
        this.props.dispatch(navigateTo(['login']))
      }},
      {name: 'Login2', onClick: () => {
        this.props.dispatch(navigateTo(['login2', 'welcome']))
      }},
      {name: 'Register', onClick: () => {
        this.props.dispatch(navigateTo(['login2', 'register']))
      }},
      {name: 'reset', onClick: () => {
        require('../../engine').reset()
        console.log('Engine reset!')
      }},
      {name: 'Sign Out', onClick: () => {
        this.props.dispatch(LoginActions.logout())
      }},
      {name: 'About', hasChildren: true, onClick: () => {
        this.props.dispatch(navigateTo(['about']))
      }},
      {name: 'Developer', hasChildren: true, onClick: () => {
        this.props.dispatch(navigateTo(['developer']))
      }},
      {name: 'Nav debug', hasChildren: true, onClick: () => {
        this.props.dispatch(navigateTo(['navDebug']))
      }},
      {name: 'Bridging', hasChildren: true, onClick: () => {
        this.props.dispatch(navigateTo(['bridging']))
      }},
      {name: 'QR', hasChildren: true, onClick: () => {
        this.props.dispatch(navigateTo(['qr']))
      }},
      {name: 'Search', hasChildren: true, onClick: () => {
        this.props.dispatch(SearchActions.pushNewSearch())
      }},
      {name: 'Profile', hasChildren: true, onClick: () => {
        this.props.dispatch(pushNewProfile('test12'))
      }}
    ]
  }

  render () {
    return (
      <div>
        <List>
          <ListItem>Login</ListItem>
        </List>
      </div>
    )
  }

  static parseRoute (store, currentPath, nextPath) {
    const routes = {
      /*
      'about': require('./about').parseRoute,
      'developer': require('./developer').parseRoute,
      'navDebug': require('../../debug/nav-debug').parseRoute,
      'bridging': require('../../debug/bridging-tabs').parseRoute,
      'qr': require('../../qr').parseRoute,
      'login': require('../../login').parseRoute,
      'login2': require('../../login2').parseRoute\
      */
    }

    const componentAtTop = {
      title: 'More',
      component: More
    }

    return {
      componentAtTop,
      parseNextRoute: routes[nextPath.get('path')] || null
    }
  }
}
