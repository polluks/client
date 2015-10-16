'use strict'
/* @flow */

import Base from "../base"
import Render from "./folders-native"

export default class Folders extends Base {
  constructor (props) {
    super(props)
  }
  render () {
    return Render.apply(this)
  }

  // TODO(mm): annotate types
  // store is our redux store
  static parseRoute (store, currentPath, nextPath) {
    return {
      componentAtTop: {
        component: Folders,
        title: 'Folders'
      },
      parseNextRoute: null
    }
  }
}
