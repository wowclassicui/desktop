import Vue from 'vue'
import VueI18n from 'vue-i18n'

const en = require('../i18n/en.json')
const fr = require('../i18n/fr.json')

Vue.use(VueI18n)

const i18n = new VueI18n({
    locale: 'en',
    fallbackLocale: 'en',
    messages: {
        en,
        fr
    }
})

export default i18n
