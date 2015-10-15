'use strict'
/* @flow */

import Base from "../base"
import Render from "./chat-native"

export default class Chat extends Base {
  constructor (props) {
    super(props)
  }
  render () {
    return Render(this.props, this.state)
  }

  static parseRoute (store, currentPath, nextPath) {
    return {
      componentAtTop: {
        component: Chat,
        title: 'Chat'
      },
      parseNextRoute: null
    }
  }
}
