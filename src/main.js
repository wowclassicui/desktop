import Vue from 'vue'
import App from './App.vue'
import axios from 'axios'
import VueAxios from 'vue-axios'
import BootstrapVue from 'bootstrap-vue'
import store from './store'
import router from './router'

import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'

// Sentry
import * as Sentry from '@sentry/electron'
if (process.env.NODE_ENV === 'production') {
  console.log('enablind Sentry since we are in prod mode')
  Sentry.init({ dsn: process.env.VUE_APP_SENTRY_DSN })
}

axios.defaults.baseURL = process.env.VUE_APP_API_BASE_URL
const token = localStorage.getItem('token')
if (token) {
  axios.defaults.headers.common['Authorization'] = 'Bearer ' + token
}

Vue.use(BootstrapVue)
Vue.use(VueAxios, axios)

Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(App),
}).$mount('#app')
