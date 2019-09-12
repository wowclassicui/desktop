import axios from 'axios'

export default {
    index (params) {
        return axios.get('/addons', {
            params
        })
    },
    show (id, params) {
        return axios.get('/addons/' + id, {
            params
        })
    },
    // find (name) {
    //     return axios.get('/addons/find/folder/' + name, {
    //         params: {
    //             include: 'mainFile,folders'
    //         }
    //     })
    // },
    findAll (folders) {
        return axios.post('/addons/find/folders', {
            folders: folders.join(','),
            include: 'mainFile,folders'
        })
    }
}
