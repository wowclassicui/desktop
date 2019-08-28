import downloads from '../api/downloads'
// import addons from '../api/addons'
const Store = require('electron-store')
const store = new Store()
const fs = require('fs')
const { app } = require('electron').remote
const unzipper = require('unzipper')

const install =  (fileId) => {
    return new Promise(async (resolve, reject) => {
        let addonsPath = store.get('installationFolder') + '/_classic_/Interface/AddOns'

        try {
            // let token = await downloads.newToken(item.mainFile.id)
            let token = await downloads.newToken(fileId)
            let downloadToken = token.data.data.token

            downloads.get(downloadToken)
                .then(async (res) => {

                    let tempPath = await saveBlob(res.data)

                    // _vm.saveBlob(res.data, function (tempPath) {
                        console.log('temp zip path', tempPath)

                        fs.createReadStream(tempPath)
                            .pipe(unzipper.Extract({
                                path: addonsPath
                            }))
                            .promise()
                            // .then(async () => {
                            //     console.log('WE ARE DONE!')

                            //     let res = await addons.show(item.id, {
                            //         include: 'mainFile'
                            //     })
                            //     let addon = res.data.data

                            //     addon.localVersion = addon.mainFile.version
                            //     addon.folder = item.folder
                            //     _vm.$set(_vm.addons, index, addon)
                            // })
                            .then(() => {
                                console.log('addon installed, resolving')
                                resolve()
                            })
                    // })
                })
        } catch (err) {
            reject(err)
        }
    })
}
// remove () {
//     return new Promise((resolve, reject) => {

//     })
// }

const saveBlob = (blob) => {
    return new Promise((resolve/*, reject*/) => {
        let reader = new FileReader()
        reader.onload = () => {
            if (reader.readyState === 2) {
                let buffer = new Buffer(reader.result)
                let tempPath = app.getPath('temp') + '/' + Math.random().toString(36).substring(7)

                fs.writeFileSync(tempPath, buffer)
                // callback(tempPath)

                resolve(tempPath)
            }
        }

        reader.readAsArrayBuffer(blob)
    })
}

export { install }
