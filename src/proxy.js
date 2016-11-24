import store from './store'

import {KEYS} from './reducer'

const obj = {}
for (let name of KEYS) {
  Object.defineProperty(obj, name, {
    get: function () {
      return store.getState()[name]
    }
  })
}

Object.defineProperty(obj, 'state', {
  get: function () {
    return store.getState()
  }
})

Object.freeze(obj)

export default obj
