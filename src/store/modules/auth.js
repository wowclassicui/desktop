import axios from 'axios'
import auth from '../../api/auth'
const { ipcRenderer: ipc } = require('electron-better-ipc')

const state = {
    status: '',
    token: localStorage.getItem('token') || '',
    user: null,
    err: null
}

// getters
const getters = {
    isLoggedIn: state => !!state.token,
    authStatus: state => state.status,
}

// actions
const actions = {
    login ({ commit }, user) {
        return new Promise((resolve, reject) => {
            commit('request')
            auth.login(user)
                .then((res) => {
                    const token = res.data.access_token
                    const user = res.data.user
                    commit('success', { token, user })
                    resolve(res)
                })
                .catch((err) => {
                    commit('error', { err })
                    // Enforce "logout"
                    localStorage.removeItem('token')
                    reject(err)
                })
        })
    },
    logout ({ commit }) {
        return new Promise((resolve) => {
            commit('logout')
            resolve()
        })
    }
}

// mutations
const mutations = {
    request (state) {
        state.status = 'loading'
    },
    success (state, { token, user }) {
        state.status = 'success'
        state.token = token
        state.user = user
        state.err = null

        localStorage.setItem('token', token)
        axios.defaults.headers.common['Authorization'] = 'Bearer ' + token

        ipc.callMain('setAxiosAuthToken', { token })
    },
    error (state, { err }) {
        state.err = err
        state.status = 'error'
    },
    logout (state) {
        state.status = ''
        state.token = ''

        localStorage.removeItem('token')
        delete axios.defaults.headers.common['Authorization']

        ipc.callMain('unsetAxiosAuthToken')
    }
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}
