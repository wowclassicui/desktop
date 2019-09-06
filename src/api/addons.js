import axios from 'axios'

export default {
    show (id, params) {
        return axios.get('/addons/' + id, {
            params
        })
    },
    find (name) {
        return axios.get('/addons/find/' + name + '?include=mainFile,folders')
    }
}
