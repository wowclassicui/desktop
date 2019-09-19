const Store = require('electron-store')
const store = new Store()
const unzipper = require('unzipper')
const crypto = require('crypto')
const del = require('del')
const blobToStream = require('blob-to-stream')
const remote = require('electron').remote
const fs = remote.require('fs')
const path = remote.require('path')
const { join } = path
const glob = require('glob')
import crc32 from 'crc/crc32'
import downloads from '../api/downloads'

const update = (addon) => {
    return new Promise((resolve, reject) => {
        // Just checking that we have in fact a mainFile to download
        if (!Object.prototype.hasOwnProperty.call(addon, 'mainFile')) {
            return reject(new Error('No main file to download, aborting'))
        }

        // Delete first
        remove(addon)
        .then((deletedPaths) => {
            // console.log('deletedPaths', deletedPaths)

            // Then install latest version
            let fileId = addon.mainFile.id

            install(fileId)
            .then(resolve)
            .catch(reject)
        })
        .catch(reject)
    })
}

const install = (fileId) => {
    return new Promise((resolve, reject) => {
        let addonsPath = getAddonsPath()

        downloads.newToken(fileId)
        .then((res) => {
            let downloadToken = res.data.data.token

            downloads.get(downloadToken)
            .then((res) => {
                // blob to stream, pipe extraction then resolve
                // using promise
                blobToStream(res.data)
                .pipe(unzipper.Extract({
                    path: addonsPath
                }))
                .promise()
                .then(resolve)
                .catch(reject)
            })
            .catch(reject)
        })
        .catch(reject)
    })
}

const remove = (addon) => {
    let addonsPath = getAddonsPath()

    // No folders to remove. Shouldn't happen, but who knows.
    if (!Object.prototype.hasOwnProperty.call(addon, 'folders') || addon.folders.length === 0) {
        return Promise.resolve([])
    }

    let foldersToDelete = addon.folders.map((folder) => {
        return path.resolve(addonsPath, folder.name)
    })

    // Returns a Promise
    return del(foldersToDelete, { force: true })
}

const getHash = (folders) => {
    return new Promise((resolve, reject) => {
        const addonsPath = getAddonsPath()

        let walkPromises = []
        folders.forEach((folder) => {
            const folderPath = path.join(addonsPath, folder)

            walkPromises.push(walkdir(folderPath))
        });

        Promise.all(walkPromises)
        .then((results) => {
            let files = [].concat(...results)

            Promise.all(files.map((file) => {
                return new Promise((resolve, reject) => {
                    fs.readFile(file, (err, buffer) => {
                        if (err) {
                            return reject(err)
                        }

                        resolve(crc32(buffer))
                    })
                })
            }))
            .then((pool) => {
                pool.sort((a, b) => {
                    if (a < b) {
                        return -1
                    }
                    if (a > b) {
                        return 1
                    }
                    return 0
                })

                let sha = crypto.createHash('sha1')
                sha.update(pool.join(''))
                const hash = sha.digest('hex')

                // resolve({ hash, pool, files })
                resolve({ hash })
            })
            .catch(reject)
        })
        .catch(reject)
    })
}

const getAddonsPath = () => {
    const installationFolder = store.get('installationFolder', null)

    if (installationFolder === null) {
        return ''
    }

    return path.resolve(
        installationFolder,
        '_classic_',
        'Interface',
        'AddOns'
    )
}

const scanAddonsDir = (path) => {
    return new Promise((resolve, reject) => {
        fs.readdir(path, (err, files) => {
            if (err) {
                return reject(err)
            }

            if (files.length === 0) {
                // No addons, yet
                return resolve()
            }

            let folders = []

            Promise.all(files.map((file) => {
                return new Promise((resolve, reject) => {
                    fs.stat(join(path, file), (err, stats) => {
                        if (err) {
                            return reject(err)
                        }

                        if (stats.isDirectory()) {
                            folders = [...folders, file]
                        }

                        resolve()
                    })
                })
            }))
            .then(() => {
                resolve(folders)
            })
            // .catch(() => {
            //     resolve([])
            // })
            .catch(resolve)
        })
    })
}

const walkdir = (dir) => {
    return new Promise((resolve, reject) => {
        try {
            const files = glob.sync('/**/*.lua', {
                root: dir
            })
            return resolve(files)
        } catch (err) {
            reject(err)
        }
    })
}

export {
    install, update, remove, getHash,
    getAddonsPath, scanAddonsDir
}
