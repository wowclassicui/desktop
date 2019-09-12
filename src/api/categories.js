import axios from 'axios'

export default {
    index (params) {
        return axios.get('/categories', {
            params
        })
    }
}
