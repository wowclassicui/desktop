import downloads from '../api/downloads'
// import addons from '../api/addons'
import crc32 from 'crc/crc32'
const Store = require('electron-store')
const store = new Store()
const fs = require('fs')
const path = require('path')
const { app } = require('electron').remote
const unzipper = require('unzipper')
const crypto = require('crypto')
const del = require('del')

const update = (addon) => {
    return new Promise(async (resolve, reject) => {
        // Just checking that we have in fact a mainFile to download
        if (!addon.mainFile) {
            return reject(new Error('No main file to download, aborting'))
        }

        // Delete first
        let deletedPaths = await remove(addon)

        if (deletedPaths.length === 0) {
            return reject(new Error('No folders deleted'))
        }

        // Then install latest v
        let fileId = addon.mainFile.id
        await install(fileId)

        resolve()
    })
}

const install = (fileId) => {
    return new Promise(async (resolve, reject) => {
        let addonsPath = getAddonsPath()

        try {
            let token = await downloads.newToken(fileId)
            let downloadToken = token.data.data.token

            downloads.get(downloadToken)
                .then(async (res) => {
                    let tempPath = await saveBlob(res.data)

                    // console.log('temp zip path', tempPath)

                    fs.createReadStream(tempPath)
                        .pipe(unzipper.Extract({
                            path: addonsPath
                        }))
                        .promise()
                        .then(() => {
                            // Addon installed, resolving
                            resolve('addon installed with success')
                        })
                })
        } catch (err) {
            reject(err)
        }
    })
}

const remove = (addon) => {
    return new Promise(async (resolve, reject) => {
        let addonsPath = getAddonsPath()

        if (!addon.folders) {
            return [] // Just in case
        }

        let deletePromises = []
        addon.folders.forEach((folder) => {
            let name = folder.name
            let path = addonsPath + '/' + name

            deletePromises.push(new Promise(async (resolve/*, reject*/) => {
                let deletedPaths = await del([path], {
                    force: true
                })

                resolve(deletedPaths)
            }))
        })

        // Wait for all promises to finish
        Promise.all(deletePromises)
            .then((deletedPaths) => {
                let all = [].concat(...deletedPaths)

                // Then resolve
                resolve(all)
            })
            .catch((err) => {
                // Or reject..
                reject(err)
            })
    })
}

const getHash = (folders) => {
    return new Promise((resolve, reject) => {
        let addonsPath = getAddonsPath()

        let walkPromises = []
        folders.forEach((folder) => {
            let path = addonsPath + '/' + folder

            console.log('walking through', path)

            try {
                walkPromises.push(walkdirPromise(path))
            } catch (err) {
                console.log('addon folder not found', err)
                // Rejection not wanted here
            }
        });

        Promise.all(walkPromises)
            .then((results) => {
                let files = [].concat(...results)

                let bank = []
                let crc
                files.forEach((file) => {
                    crc = crc32(fs.readFileSync(file))
                    bank.push(crc)
                })

                bank.sort((a, b) => {
                    if (a < b) {
                        return -1
                    }
                    if (a > b) {
                        return 1
                    }
                    return 0
                })

                let shasum = crypto.createHash('sha1')
                shasum.update(bank.join(''))
                let hash = shasum.digest('hex')

                return resolve({
                    hash,
                    bank,
                    files
                })
            })
            .catch((err) => {
                console.log('promises walkdir err', err)
                reject(err)
            })
    })
}

const getAddonsPath = () => {
    return store.get('installationFolder') + '/_classic_/Interface/AddOns'
}

// --- PRIVATE ---

const saveBlob = (blob) => {
    return new Promise((resolve/*, reject*/) => {
        let reader = new FileReader()
        reader.onload = () => {
            if (reader.readyState === 2) {
                let buffer = new Buffer(reader.result)
                let tempPath = app.getPath('temp') + '/' + Math.random().toString(36).substring(7)

                fs.writeFileSync(tempPath, buffer)

                resolve(tempPath)
            }
        }

        reader.readAsArrayBuffer(blob)
    })
}

const walkdirPromise = (dir) => {
    return new Promise((resolve/* , reject */) => {
        walkdir(dir, (err, files) => {
            if (err) {
                // return reject(err)
                // Mute "folder not found" and others..
                return resolve([])
            }

            resolve(files)
        })
    })
}

const walkdir = (dir, callback) => {
    let results = []

    fs.readdir(dir, (err, files) => {
        if (err) {
            return callback(err)
        }

        let pending = files.length
        if (!pending) {
            return callback(null, results)
        }

        files.forEach((file) => {
            file = path.resolve(dir, file)
            fs.stat(file, (err, stat) => {
                if (stat && stat.isDirectory()) {
                    walkdir(file, (err, res) => {
                        results = results.concat(res)

                        if (!--pending) {
                            callback(null, results)
                        }
                    })
                } else {
                    // We only want dot lua files
                    if (file.endsWith('.lua')) {
                        results.push(file)
                    }
                    // results.push(file)

                    if (!--pending) {
                        callback(null, results)
                    }
                }
            })
        })
    })
}

export { install, update, remove, getHash, getAddonsPath }
