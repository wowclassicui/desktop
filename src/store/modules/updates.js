import { update } from '@/utils/addons'
const { ipcRenderer: ipc } = require('electron-better-ipc')

const state = {
    loading: false,
    updating: false,
    data: {},
    count: 0,
    err: null
}

const getters = {
    loading: state => state.loading,
    updating: state => state.updating,
    data: state => state.data,
    count: state => state.count,
    err: state => state.err
}

const actions = {
    async look ({ commit }, addons) {
        commit('loading')

        try {
            let needsUpdate = {}

            await Promise.all(addons.map(async (addon/* , index */) => {
                if (addon.mainFile === null) {
                    // No main file here, skipping
                    return
                }

                // Let's define what we're looking for
                let folders = []
                if (addon.folders && addon.folders.length > 0) {
                    folders = addon.folders.map(a => a.name)
                } else {
                    folders.push(addon.name)
                }

                // const { hash } = await getHash(folders)
                const hash = await ipc.callMain('addonGetHash', folders)

                if (hash !== addon.mainFile.hash) {
                    needsUpdate[addon.id] = {
                        updating: false
                    }
                }

                // return hash
            }))

            commit('looked', { needsUpdate })
            return Promise.resolve(needsUpdate)
        } catch (err) {
            commit('failed', { err })
            return Promise.reject(err)
        }
    },
    async update ({ commit }, addon) {
        const id = addon.id
        commit('updating', { id })

        try {
            const result = await update(addon)
            // const result = await ipc.callMain('addonUpdate', addon)

            commit('updated', { id })
            return Promise.resolve(result)
        } catch (err) {
            commit('failed', { err })
            return Promise.reject(err)
        }
    },
    reset ({ commit }) {
        return new Promise((resolve) => {
            commit('reset')
            resolve()
        })
    }
}

const mutations = {
    loading (state) {
        state.loading = true
    },
    looked (state, { needsUpdate }) {
        state.data = needsUpdate
        state.count = Object.keys(needsUpdate).length
        state.err = null
        state.loading = false
    },
    updating (state, { id }) {
        state.updating = true
        state.data = Object.assign(state.data, {
            [id]: {
                updating: true
            }
        })
    },
    updated (state, { id }) {
        delete state.data[id]
        state.count--
        state.updating = false
    },
    reset (state) {
        state.data = []
        state.count = 0
        state.err = null
    },
    failed (state, { err }) {
        state.err = err
        state.loading = false
        state.updating = false
    }
}

export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations
}
