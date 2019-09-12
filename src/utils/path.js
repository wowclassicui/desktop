const regedit = require('regedit')
const path = require('path')
const Store = require('electron-store')
const store = new Store()

const getWowPath = async () => {
    if (!store.has('installationFolder')) {
        const installationFolder = await wowDefaultPath()
        if (installationFolder !== null) {
            store.set('installationFolder', installationFolder)
        }
    }

    return store.get('installationFolder')
}

const wowDefaultPath = () => {
    return new Promise((resolve, reject) => {
        if (process.platform !== 'win32') {
            return resolve(null)
        }

        regedit.setExternalVBSLocation('resources/node_modules/regedit/vbs')

        const key = 'HKLM\\SOFTWARE\\WOW6432Node\\Blizzard Entertainment\\World of Warcraft'

        regedit.list(key, (err, res) => {
            if (err) {
                return reject(err)
            }

            resolve(path.join(res[key].values.InstallPath.value, '..'))
        })
    })
}

export { getWowPath, wowDefaultPath }
