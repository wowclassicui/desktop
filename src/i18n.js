import Vue from 'vue'
import VueI18n from 'vue-i18n'

// const en = require('../i18n/en.json')
// const fr = require('../i18n/fr.json')

function loadMessages () {
    const locales = require.context('../i18n', true, /[A-Za-z0-9-_,\s]+\.json$/i)
    const messages = {}
    locales.keys().forEach(key => {
        const matched = key.match(/([A-Za-z0-9-_]+)\./i)
        if (matched && matched.length > 1) {
            const locale = matched[1]
            messages[locale] = locales(key)
        }
    })
    return messages
}

Vue.use(VueI18n)

export default new VueI18n({
    locale: 'en',
    fallbackLocale: 'en',
    messages: loadMessages()
})
