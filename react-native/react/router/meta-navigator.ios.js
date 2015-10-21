'use strict'
/**
 * @providesModule Meta Navigator
 * A Meta navigator for handling different navigators at the top level.
 * todo(mm) explain why we need a meta navigator
 */

import React, { Component, View } from '../base-react'
import BaseComponent from '../base-component'
import { connect } from '../base-redux'
import Immutable from 'immutable'

class MetaNavigator extends BaseComponent {
  constructor () {
    super()

    this.state = {
    }
  }

  isParentOfRoute (routeParent, routeMaybeChild) {
    return (
      !Immutable.is(routeMaybeChild, routeParent) &&
      Immutable.is(routeMaybeChild.slice(0, routeParent.count()), routeParent)
    )
  }

  shouldComponentUpdate (nextProps, nextState) {
    const { store, rootComponent } = this.props
    const route = this.props.uri
    const nextRoute = nextProps.uri

    const { componentAtTop, routeStack: nextRouteStack } = this.getComponentAtTop(rootComponent, store, nextRoute)
    if (nextProps === this.props && nextState === this.state) {
      return false
    } else if (this.isParentOfRoute(route, nextRoute)) {
      this.refs.navigator.push(componentAtTop)
      return true
    // TODO: also check to see if this route exists in the navigator's route
    } else if (this.isParentOfRoute(nextRoute, route)) {
      const navRoutes = this.refs.navigator.getCurrentRoutes()
      const targetRoute = navRoutes.reverse().find(navRoute =>
          navRoute.component === componentAtTop.component && navRoute.title === componentAtTop.title
      )
      this.refs.navigator.popToRoute(targetRoute)
      return true
    } else {
      this.refs.navigator.immediatelyResetRouteStack(nextRouteStack.toJS())
      return true
    }
  }

  getComponentAtTop (rootComponent, store, uri) {
    let currentPath = uri.first() || Immutable.Map()
    let nextPath = uri.rest().first() || Immutable.Map()
    let restPath = uri.rest().rest()
    let routeStack = Immutable.List()

    let nextComponent = rootComponent
    let parseNextRoute = rootComponent.parseRoute
    let componentAtTop = null

    while (parseNextRoute) {
      const t = parseNextRoute(store, currentPath, nextPath, uri)
      componentAtTop = {
        ...t.componentAtTop,
        upLink: currentPath.get('upLink'),
        upTitle: currentPath.get('upTitle')
      }

      // If the component was created through subRoutes we have access to the nextComponent implicitly
      if (!componentAtTop.component && nextComponent) {
        componentAtTop.component = nextComponent
      }

      nextComponent = null
      parseNextRoute = t.parseNextRoute

      // If you return subRoutes, we'll figure out which route is next
      // We also handle globalRoutes here
      if (!parseNextRoute) {
        const subRoutes = {
          ...this.props.globalRoutes,
          ...t.subRoutes
        }

        if (subRoutes[nextPath.get('path')]) {
          nextComponent = subRoutes[nextPath.get('path')]
          parseNextRoute = nextComponent.parseRoute
        }
      }

      routeStack = routeStack.push(componentAtTop)

      currentPath = nextPath
      nextPath = restPath.first() || Immutable.Map()
      restPath = restPath.rest()
    }

    return {componentAtTop, routeStack}
  }

  render () {
    const { store, rootComponent, uri, NavBar, Navigator } = this.props

    let {componentAtTop, routeStack} = this.getComponentAtTop(rootComponent, store, uri)

    return (
      <Navigator
        saveName='main'
        ref='navigator'
        initialRouteStack={routeStack.toJS()}
        configureScene={route => route.sceneConfig || Navigator.SceneConfigs.FloatFromRight }
        renderScene={(route, navigator) => {
          return (
            <View style={{flex: 1, marginTop: route.hideNavBar ? 0 : this.props.navBarHeight}}>
              {React.createElement(connect(route.mapStateToProps || (state => state))(route.component), {...route.props})}
            </View>
          )
        }}
        navigationBar={componentAtTop.hideNavBar ? null : NavBar}
      />
    )
  }
}

MetaNavigator.propTypes = {
  uri: React.PropTypes.object.isRequired,
  store: React.PropTypes.object.isRequired,
  NavBar: React.PropTypes.object.isRequired,
  rootComponent: React.PropTypes.func.isRequired,
  Navigator: React.PropTypes.object.isRequired,
  globalRoutes: React.PropTypes.object,
  navBarHeight: React.PropTypes.number.isRequired
}

export default MetaNavigator
