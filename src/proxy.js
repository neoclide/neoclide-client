import store from './store'

import {KEYS} from './reducers/neovim'

const obj = {}
for (let name of KEYS) {
  Object.defineProperty(obj, name, {
    get: function () {
      return store.getState().neovim[name]
    }
  })
}

Object.defineProperty(obj, 'state', {
  get: function () {
    return store.getState().neovim
  }
})

Object.freeze(obj)

export default obj
