const Store = require('electron-store')
const store = new Store()

const state = {
    list: store.get('excludeList', [])
}

// getters
const getters = {
    list: state => state.list
}

// actions
const actions = {
    add ({ commit }, id) {
        return new Promise((resolve) => {
            commit('add', { id })
            resolve()
        })
    },
    remove ({ commit }, id) {
        return new Promise((resolve) => {
            commit('remove', { id })
            resolve()
        })
    }
}

// mutations
const mutations = {
    add (state, { id }) {
        if (state.list.indexOf(id) === -1) {
            state.list.push(id)
            store.set('excludeList', state.list)
        }
    },
    remove (state, { id }) {
        const index = state.list.indexOf(id)
        if (index === -1) {
            return
        }
        state.list.splice(index, 1)
        store.set('excludeList', state.list)
    }
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}
