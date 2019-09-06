import axios from 'axios'

export default {
    login (credentials) {
        return axios.post('/auth/login', credentials)
    }
}
