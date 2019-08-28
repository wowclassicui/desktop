import axios from 'axios'
import auth from '../../api/auth'

// initial state
// shape: [{ id, quantity }]
const state = {
//   items: [],
//   checkoutStatus: null
    status: '',
    token: localStorage.getItem('token') || '',
    user: null,
}

// getters
const getters = {
//   cartProducts: (state, getters, rootState) => {
//     return state.items.map(({ id, quantity }) => {
//       const product = rootState.products.all.find(product => product.id === id)
//       return {
//         title: product.title,
//         price: product.price,
//         quantity
//       }
//     })
//   },

//   cartTotalPrice: (state, getters) => {
//     return getters.cartProducts.reduce((total, product) => {
//       return total + product.price * product.quantity
//     }, 0)
//   }

    isLoggedIn: state => !!state.token,
    authStatus: state => state.status,
}

// actions
const actions = {
//   checkout ({ commit, state }, products) {
//     const savedCartItems = [...state.items]
//     commit('setCheckoutStatus', null)
//     // empty cart
//     commit('setCartItems', { items: [] })
//     shop.buyProducts(
//       products,
//       () => commit('setCheckoutStatus', 'successful'),
//       () => {
//         commit('setCheckoutStatus', 'failed')
//         // rollback to the cart saved before sending the request
//         commit('setCartItems', { items: savedCartItems })
//       }
//     )
//   },

//   addProductToCart ({ state, commit }, product) {
//     commit('setCheckoutStatus', null)
//     if (product.inventory > 0) {
//       const cartItem = state.items.find(item => item.id === product.id)
//       if (!cartItem) {
//         commit('pushProductToCart', { id: product.id })
//       } else {
//         commit('incrementItemQuantity', cartItem)
//       }
//       // remove 1 item from stock
//       commit('products/decrementProductInventory', { id: product.id }, { root: true })
//     }
//   }

    login({ commit }, user) {
        return new Promise((resolve, reject) => {
            commit('auth_request')
            auth.login(user)
                .then(resp => {
                    // const token = resp.data.token
                    const token = resp.data.access_token
                    const user = resp.data.user
                    localStorage.setItem('token', token)
                    axios.defaults.headers.common['Authorization'] = 'Bearer ' + token
                    commit('auth_success', { token, user })
                    resolve(resp)
                })
                .catch(err => {
                    commit('auth_error')
                    localStorage.removeItem('token')
                    reject(err)
                })
        })
    },
    logout({ commit }) {
        return new Promise((resolve/*, reject*/) => {
            commit('logout')
            localStorage.removeItem('token')
            delete axios.defaults.headers.common['Authorization']
            resolve()
        })
    }
}

// mutations
const mutations = {
//   pushProductToCart (state, { id }) {
//     state.items.push({
//       id,
//       quantity: 1
//     })
//   },

//   incrementItemQuantity (state, { id }) {
//     const cartItem = state.items.find(item => item.id === id)
//     cartItem.quantity++
//   },

//   setCartItems (state, { items }) {
//     state.items = items
//   },

//   setCheckoutStatus (state, status) {
//     state.checkoutStatus = status
//   }
    auth_request(state) {
        state.status = 'loading'
    },
    auth_success(state, { token, user }) {
        state.status = 'success'
        state.token = token
        state.user = user
    },
    auth_error(state) {
        state.status = 'error'
    },
    logout(state) {
        state.status = ''
        state.token = ''
    },
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}
