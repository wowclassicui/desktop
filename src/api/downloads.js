import axios from 'axios'

export default {
    newToken (fileId) {
        return axios.get('/downloads/token/' + fileId)
    },
    get (token) {
        return axios({
            method: 'GET',
            url: '/downloads/' + token,
            responseType: 'blob'
        })
    }
}
