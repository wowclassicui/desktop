import Vue from 'vue'
import App from './App.vue'
import axios from 'axios'
import VueAxios from 'vue-axios'
import BootstrapVue from 'bootstrap-vue'
import { library } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { far } from '@fortawesome/free-regular-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

import store from './store'
import router from './router'
import i18n from './i18n'

// Axios
axios.defaults.baseURL = process.env.VUE_APP_API_BASE_URL
const token = localStorage.getItem('token')
if (token) {
    axios.defaults.headers.common['Authorization'] = 'Bearer ' + token
}
axios.defaults.timeout = 15000

Vue.use(BootstrapVue)
Vue.use(VueAxios, axios)

// FontAwesome
library.add(fas, far)
Vue.component('font-awesome-icon', FontAwesomeIcon)

Vue.config.productionTip = false

const app = new Vue({
    router,
    store,
    i18n,
    render: h => h(App),
}).$mount('#app')

// Hot updates
if (module.hot) {
    module.hot.accept(['../i18n/en', '../i18n/fr'], function () {
        app.$i18n.setLocaleMessage('en', require('../i18n/en').default)
        app.$i18n.setLocaleMessage('fr', require('../i18n/fr').default)
    })
}
