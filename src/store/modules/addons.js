const Store = require('electron-store')
const store = new Store()

const state = {
    loading: false,
    data: store.get('addons', []),
}

const getters = {
    loading: state => state.loading,
    data: state => state.data
}

const actions = {
    fetch ({ commit }) {
        return new Promise((resolve, reject) => {

        })
    },
    remove ({ commit }, name) {
        return new Promise((resolve, reject) => {

        })
    },
    install ({ commit }, id) {

    }
}

const mutations = {

}

export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations
}
