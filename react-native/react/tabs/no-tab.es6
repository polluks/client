'use strict'
/* @flow */

import Base from "../base"
import React from 'react'

export default class NoTab extends Base {
  render () {
    return (
      <div style={{flex: 1, justifyContent: 'center', backgroundColor: 'red'}}>
        <p> Error! Tab name was not recognized</p>
      </div>
    )
  }

  static parseRoute (store, currentPath, nextPath) {
    const componentAtTop = {
      component: NoTab
    }

    return {
      componentAtTop,
      parseNextRoute: null
    }
  }
}
