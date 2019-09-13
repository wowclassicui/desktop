import { scanAddonsDir } from '../../utils/addons'
import addons from '../../api/addons'

const state = {
    loading: false,
    scanned: false,
    data: [],
    err: null
}

const getters = {
    loading: state => state.loading,
    scanned: state => state.scanned,
    data: state => state.data,
    err: state => state.err
}

const actions = {
    async scan ({ commit }, path) {
        try {
            commit('loading')
            let folders = await scanAddonsDir(path)
            let res = await addons.findAll(folders)

            let data = res.data.data
            commit('scanned', { data })

            return data
        } catch (err) {
            commit('failed', { err })
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
        state.loading = false
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
