'use strict'
/* @flow */

import Base from "../base"
import Render from "./people-native"

export default class People extends Base {
  constructor (props) {
    super(props)
    this.state = {count: 0}
  }

  render () {
    return Render(this.props, this.state)
  }

  static parseRoute (store, currentPath, nextPath) {
    return {
      componentAtTop: {
        component: People,
        title: 'People'
      },
      parseNextRoute: null
    }
  }
}
