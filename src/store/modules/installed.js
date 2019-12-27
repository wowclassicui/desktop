import addons from '../../api/addons'
const { ipcRenderer: ipc } = require('electron-better-ipc')

const state = {
    loading: false,
    installing: false,
    scanned: false,
    data: [],
    err: null
}

const getters = {
    loading: state => state.loading,
    installing: state => state.installing,
    scanned: state => state.scanned,
    data: state => state.data,
    err: state => state.err
}

const actions = {
    async scan ({ commit }, path) {
        try {
            commit('loading')
            const folders = await ipc.callMain('scanAddons', path)
            const res = await addons.findAll(folders)

            const data = res.data.data
            commit('scanned', { data })

            // return data
            return Promise.resolve(data)
        } catch (err) {
            commit('failed', { err })
            return Promise.reject(err)
        }
    },
    async install ({ commit }, addon) {
        try {
            commit('installing')
            const result = await ipc.callMain('addonInstall', addon)

            commit('installed', addon)
            return Promise.resolve(result)
        } catch (err) {
            // commit('failedInstalling', addon)
            commit('failed', { err })
            return Promise.reject(err)
        }
    }
}

const mutations = {
    loading (state) {
        state.loading = true
    },
    scanned (state, { data }) {
        state.data = data
        state.scanned = true
        state.err = null
        state.loading = false
    },
    installing (state/* , addon */) {
        state.installing = true
        // state.installingId = addon.id
    },
    installed (state, addon) {
        state.data.push(addon)
        state.installing = false
    },
    remove (state, addon) {
        const index = state.data.map((e) => { return e.id }).indexOf(addon.id)
        state.data.splice(index, 1)
    },
    reset (state) {
        state.data = []
        state.scanned = false
        state.err = null
    },
    failed (state, { err }) {
        state.err = err
        state.loading = false
    }
}

export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations
}
