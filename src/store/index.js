import Vue from 'vue'
import Vuex from 'vuex'
import auth from './modules/auth'
import addons from './modules/addons'
import installed from './modules/installed'
// import createLogger from '../../../src/plugins/logger'

Vue.use(Vuex)

const debug = process.env.NODE_ENV !== 'production'

export default new Vuex.Store({
  modules: {
    auth,
    addons,
    installed
  },
  strict: debug,
//   plugins: debug ? [createLogger()] : []
})
