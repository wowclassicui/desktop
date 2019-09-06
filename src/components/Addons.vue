<template>
    <div>
        <b-container fluid>
            <div v-if="mustSpecifyFolder">
                <b-alert show variant="warning">
                    Please specify your WoW Classic installation folder.
                    Check out <a href="#" @click.prevent="$router.push('settings')">Settings</a>.
                </b-alert>
            </div>
            <div v-else>
                <b-button-group class="mb-2">
                    <b-button @click="fetch" :disabled="loading">
                        <span v-if="loading">Fetching..</span>
                        <span v-else>Fetch</span>
                    </b-button>
                    <b-button>Update All</b-button>
                </b-button-group>

                <b-table
                    sticky-header
                    striped
                    hover
                    head-variant="light"
                    borderless
                    responsive
                    :items="addons"
                    :fields="fields"
                    class="h-100"
                >
                    <!-- Logo -->
                    <template slot="[logo]" slot-scope="data">
                        <img
                            class="img-fluid"
                            style="max-width: 32px"
                            :src="getLogoUrl(data.item)"
                            :alt="data.item.slug"
                        >
                    </template>
                    <!-- Actions -->
                    <template slot="[actions]" slot-scope="data">
                        <!-- Update -->
                        <b-button
                            v-if="data.item.mainFile !== null && data.item.mainFile.hash !== data.item.meta.localHash"
                            size="sm"
                            @click="onUpdate(data.index, data.item)"
                            :disabled="loading"
                        >Update</b-button>
                        <!-- Remove -->
                        <b-button
                            size="sm"
                            @click="onRemove(data.index, data.item)"
                            :disabled="loading"
                        >Remove</b-button>
                    </template>

                </b-table>
            </div>
        </b-container>
    </div>
</template>

<script>
const Store = require('electron-store')
const store = new Store()
const fs = require('fs')
const readline = require('readline')
import addons from '../api/addons'
import downloads from '../api/downloads'

const { app } = require('electron').remote
const unzipper = require('unzipper')

const del = require('del')

import { install, getHash, getAddonsPath } from '../utils/addons'

export default {
    computed: {
        mustSpecifyFolder () {
            return !store.has('installationFolder')
        }
    },
    data () {
        return {
            fields: [
                {
                    key: 'logo',
                    label: ''
                },
                {
                    key: 'name',
                    label: 'Name',
                    sortable: true
                },
                {
                    key: 'downloads',
                    label: 'Downloads',
                    sortable: true
                },
                {
                    key: 'remote_version',
                    label: 'Latest',
                    key: 'mainFile.version'
                },
                {
                    key: 'actions',
                    label: ''
                }
            ],
            addons: [],
            loading: false
        }
    },
    methods: {
        async fetch () {
            if (this.mustSpecifyFolder) {
                return
            }

            // Reset addons table
            this.addons = []

            let exists = []

            let _vm = this
            this.loading = true

            let addonsPath = getAddonsPath()

            console.log('fetching..', addonsPath)

            // --- TODO: Move this out
            const fetchAddonsPath = (path) => {
                return new Promise((resolve, reject) => {
                    fs.readdir(path, (err, files) => {
                        if (err) {
                            // AddOns path was probably not found.
                            // Should we do something about it?
                            return reject(err)
                        }

                        resolve(files)
                    })
                })
            }
            // ---

            console.log('scanning addons path..')

            let files = await fetchAddonsPath(addonsPath)

            console.log('fetching api for matches..')

            let fetchPromises = []
            files.forEach((file) => {
                // TODO: Can also be a file, how to check?
                let folder = file

                fetchPromises.push(new Promise((resolve/*, reject*/) => {
                    addons.find(folder)
                        .then(async (resp) => {
                            console.log('find', resp)
                            let row = resp.data.data

                            // Avoid duplicates
                            if (exists.includes(row.id)) {
                                console.log('exists', row.name)
                                return resolve(null)
                            }
                            exists.push(row.id)

                            if (row.mainFile === null) {
                                // No main file here, skipping for now
                                console.log('no main file for', row.name)
                                return resolve(null)
                            }

                            // Let's define what we're looking for
                            let folders = []
                            if (row.folders && row.folders.length > 0) {
                                folders = row.folders.map(a => a.name)
                            } else {
                                folders.push(row.name)
                            }

                            // console.log('addon', row.name, folders)

                            let { hash, bank, files } = await getHash(folders)

                            row.meta = {
                                folder,
                                localHash: hash
                            }

                            // console.log('files', files)

                            // console.log('localCrc', bank)
                            // console.log('remoteCrc', row.mainFile.crc)

                            // let arrA = bank
                            // let arrB = row.mainFile.crc

                            // let difference = arrA
                            //     .filter(x => !arrB.includes(x))
                            //     .concat(arrB.filter(x => !arrA.includes(x)))

                            // console.log('diff', difference)

                            console.log('localHash', row.meta.localHash)
                            console.log('remoteHash', row.mainFile.hash)

                            _vm.addons.push(row)
                            resolve(true)
                        })
                        .catch((err) => {
                            console.log('failed fetching - 404 maybe?')
                            resolve(null)
                        })

                        // .catch(reject)

                        // .catch(() => {
                        //     console.log('failed fetching - 404 maybe?')
                        // })
                }))
            })

            Promise.all(fetchPromises)
                .then((addons) => {
                    // addons.forEach((addon) => {
                    //     if (addon === null) {
                    //         return
                    //     }

                    //     _vm.addons.push(addon)
                    // })

                    _vm.loading = false
                })
                .catch((errors) => {
                    // Should never reject. But who knows.
                    console.log('fetchPromises catch', errors)
                    _vm.loading = false
                })
        },
        async onUpdate (index, item) {
            this.loading = true

            // try {
                let fileId = item.mainFile.id
                await install(fileId) // TODO: Send folders to remove

                let res = await addons.show(item.id, {
                    include: 'mainFile'
                })
                let addon = res.data.data

                addon.meta = {
                    folder: item.folder,
                    localHash: addon.mainFile ? addon.mainFile.hash : null
                }

                this.$set(this.addons, index, addon)
            // } catch (err) {
            //     console.log('err', err)
            // }

            this.loading = false

            // let _vm = this
            // let addonsPath = store.get('installationFolder') + '/_classic_/Interface/AddOns'

            // try {
            //     let token = await downloads.newToken(item.mainFile.id)
            //     let downloadToken = token.data.data.token

            //     downloads.get(downloadToken)
            //         .then((res) => {
            //             _vm.saveBlob(res.data, function (tempPath) {
            //                 console.log('temp zip path', tempPath)

            //                 fs.createReadStream(tempPath)
            //                     .pipe(unzipper.Extract({
            //                         path: addonsPath
            //                     }))
            //                     .promise()
            //                     .then(async () => {
            //                         console.log('WE ARE DONE!')

            //                         let res = await addons.show(item.id, {
            //                             include: 'mainFile'
            //                         })
            //                         let addon = res.data.data

            //                         addon.localVersion = addon.mainFile.version
            //                         addon.folder = item.folder
            //                         _vm.$set(_vm.addons, index, addon)
            //                     })
            //             })
            //         })
            // } catch (err) {
            //     console.log('download exception', err)
            // }
        },
        async onRemove (index, item) {
            this.loading = true

            let addonsPath = store.get('installationFolder') + '/_classic_/Interface/AddOns'

            let path = addonsPath + '/' + item.folder

            let deletedPaths = await del([path], {
                force: true
            })

            if (deletedPaths.length > 0) {
                this.$delete(this.addons, index)
            }

            this.loading = false
        },
        getLogoUrl (item) {
            let media = item.media.filter((obj) => {
                return obj.collection === 'logo'
            })

            if (media[0] !== null) {
                return media[0].links.web
            }
        }
    },
    mounted () {
        // this.fetch()
    }
}
</script>
