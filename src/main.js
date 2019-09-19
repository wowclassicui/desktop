import Vue from 'vue'
import App from './App.vue'
import axios from 'axios'
import VueAxios from 'vue-axios'
import BootstrapVue from 'bootstrap-vue'
import { library } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { far } from '@fortawesome/free-regular-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

const { ipcRenderer } = require('electron')
const Store = require('electron-store')
const electronStore = new Store()
import moment from 'moment'
// const notifier = require('node-notifier')

import store from './store'
import router from './router'
import i18n from './i18n'
import { initWowPath } from '@/utils/path'
import { getAddonsPath } from '@/utils/addons'

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

// WoW Folder
initWowPath()

// Locale
const locale = electronStore.get('locale', 'en')
i18n.locale = locale
moment.locale(locale)

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

// Events
ipcRenderer.send('initLookForUpdates', {
    lookForUpdates: electronStore.get('lookForUpdates', true),
    checkInterval: electronStore.get('checkInterval', 1)
})

let addonsPath
let addons
// let needsUpdate
ipcRenderer.on('askForUpdate', async (/* evt, args */) => {
    addonsPath = getAddonsPath()
    if (addonsPath === '') {
        return
    }

    // One at a time!
    if (
        app.$store.getters['installed/loading'] ||
        app.$store.getters['updates/loading'] ||
        app.$store.getters['updates/updating']
    ) {
        return
    }

    electronStore.set('lastCheck', new Date())

    await app.$store.dispatch('updates/reset')
    addons = await app.$store.dispatch('installed/scan', addonsPath)
    await app.$store.dispatch('updates/look', addons)

    if (app.$store.getters['updates/count'] > 0) {
        for (const id in app.$store.getters['updates/data']) {
            const addon = addons.find((value) => {
                // Warning: "id" is String, not Integer
                return value.id == id
            })

            // Should never happen. Doing this for safety.
            if (addon === undefined) {
                return
            }

            // Update addon (await should not be required here)
            app.$store.dispatch('updates/update', addon)
            .then(() => {
                // notifier.notify({
                //     title: 'Updated: ' + addon.name,
                //     body: "We've automatically updated " + addon.name + " while you were away."
                // })
            })
        }
    }
})
