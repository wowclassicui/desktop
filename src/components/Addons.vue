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
                <!-- Top Actions -->
                <b-button-toolbar>
                    <b-button-group class="my-1">
                        <!-- Fetch -->
                        <b-button @click="fetch" :disabled="loading">
                            <span v-if="loading">Fetching..</span>
                            <span v-else>Fetch</span>
                        </b-button>
                    </b-button-group>
                    <!-- <b-button-group class="mx-1">
                        <b-button>Update All</b-button>
                    </b-button-group> -->
                </b-button-toolbar>
                <!-- Table -->
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
                        <b-button-toolbar>
                            <b-button-group>
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
                            </b-button-group>
                        </b-button-toolbar>
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
// const { app } = require('electron').remote
import addons from '../api/addons'

import { install, update, remove, getHash, getAddonsPath } from '../utils/addons'

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

                    console.log('all done fetching stuff!')

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

            console.log('updating..', item.name)

            try {
                let result = await update(item)

                console.log('update done, now fetching addon status again')

                let res = await addons.show(item.id, {
                    include: 'mainFile,folders'
                })
                let addon = res.data.data

                addon.meta = {
                    folder: item.folder,
                    localHash: addon.mainFile ? addon.mainFile.hash : null
                }

                this.$set(this.addons, index, addon)
            } catch (err) {
                console.log('failed to update?', err)
            }

            console.log('update process ended')

            this.loading = false
        },
        async onRemove (index, item) {
            this.loading = true

            console.log('starting to delete some stuff..')

            let deletedPaths = await remove(item)

            console.log('deleted paths', deletedPaths)

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
