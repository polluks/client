'use strict'

import configureStoreNative from './configure-store.native'
import {applyMiddleware} from 'redux'
import thunkMiddleware from 'redux-thunk'
import createLogger from 'redux-logger'
import rootReducer from '../reducers'
import Immutable from 'immutable'
import {isDev} from '../constants/platform'

// Transform objects from Immutable on printing
const objToJS = (state) => {
  var newState = {}

  Object.keys(state).forEach(i => {
    if (Immutable.Iterable.isIterable(state[i])) {
      newState[i] = state[i].toJS()
    } else {
      newState[i] = state[i]
    }
  })

  return newState
}

// Only log if isDev
const loggerMiddleware = createLogger({
  predicate: (getState, action) => isDev,
  transformer: objToJS,
  actionTransformer: objToJS
})

const createStoreWithMiddleware = applyMiddleware(
  thunkMiddleware,
  loggerMiddleware
)

export default function configureStore (initialState: ?any) {
  return configureStoreNative(createStoreWithMiddleware)(rootReducer, initialState)
}
