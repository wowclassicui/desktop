import addons from '../../api/addons'

const state = {
    loading: false,
    data: [],
    cursor: {
        count: 0,
        current: null,
        next: null,
        previous: null
    },
    err: null
}

const getters = {
    loading: state => state.loading,
    data: state => state.data,
    cursor: state => state.cursor,
    err: state => state.err
}

const actions = {
    fetch ({ commit }, { limit, cursor, previous }) {
        return new Promise((resolve, reject) => {
            commit('loading')

            // console.log('params', cursor, previous)

            addons.index({
                limit,
                cursor,
                previous,
                include: 'mainFile,folders,category'
            })
                .then((res) => {
                    let addons = res.data.data
                    let cursor = res.data.cursor

                    if (cursor === 0) {
                        commit('set', { addons, cursor })
                    } else {
                        commit('append', { addons, cursor })
                    }

                    resolve(addons)
                })
                .catch((err) => {
                    commit('failed', { err })
                    reject(err)
                })
        })
    }
}

const mutations = {
    loading (state) {
        state.loading = true
    },
    set (state, { addons, cursor }) {
        state.data = addons
        state.cursor = cursor
        state.loading = false
    },
    append (state, { addons, cursor }) {
        state.data = state.data.concat(addons)
        state.cursor = cursor
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
