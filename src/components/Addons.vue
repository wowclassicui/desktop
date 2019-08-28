<template>
    <div>
        <b-container fluid>
            <h1>My Addons</h1>

            <div v-if="mustSpecifyFolder">
                <b-alert show variant="warning">
                    Please specify your WoW Classic installation folder.
                    Check out <a href="#" @click.prevent="$router.push('settings')">Settings</a>.
                </b-alert>
            </div>
            <div v-else>
                <b-button-group class="mb-2">
                    <b-button @click="fetch" :disabled="fetching">Fetch</b-button>
                    <!-- <b-button>Update All</b-button> -->
                </b-button-group>

                <b-table sticky-header striped hover head-variant="light" :items="addons" :fields="fields">

                    <template slot="[actions]" slot-scope="data">
                        <b-button
                            v-if="data.item.mainFile !== null && data.item.mainFile.version !== data.item.localVersion"
                            size="sm"
                            @click="onUpdate(data.index, data.item)"
                        >Update</b-button>

                        <b-button
                            size="sm"
                            @click="onRemove(data.index, data.item)"
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

import { install } from '../utils/addons'

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
                    label: 'Local',
                    key: 'localVersion'
                },
                {
                    key: 'actions',
                    label: ''
                }
            ],
            addons: [],
            fetched: false,
            fetching: false
        }
    },
    methods: {
        async fetch () {
            if (this.mustSpecifyFolder) {
                return
            }

            this.addons = []

            let _vm = this
            this.fetching = true

            let addonsPath = store.get('installationFolder') + '/_classic_/Interface/AddOns'

            fs.readdir(addonsPath, (err, files) => {
                for (let folder of files) {
                    addons.find(folder)
                        .then((resp) => {
                            console.log(resp)

                            let row = resp.data.data

                            row.folder = folder

                            let tocPath = addonsPath + '/' + folder + '/' + folder + '.toc'
                            console.log('tocPath', tocPath)

                            let rl = readline.createInterface({
                                input: fs.createReadStream(addonsPath + '/' + folder + '/' + folder + '.toc')
                            })

                            let localVersion = null

                            rl.on('line', function (line) {
                                if (line.includes('## Version:')) {
                                    console.log('FOUND')

                                    localVersion = line.replace('## Version:', '')
                                    console.log('local version', localVersion)

                                    row.localVersion = localVersion.trim()

                                    rl.close()
                                }
                            })

                            rl.on('close', function () {
                                console.log('parser closed')
                                _vm.addons.push(row)
                            })

                        })
                        // .catch(() => {
                        //     console.log(err)
                        // })

                }

            })

            // NOTE: use Promise.all for true async
            this.fetching = false
            this.fetched = true
        },
        async onUpdate (index, item) {
            console.log('item', item)

            try {
                let fileId = item.mainFile.id
                await install(fileId)

                let res = await addons.show(item.id, {
                    include: 'mainFile'
                })
                let addon = res.data.data

                addon.localVersion = addon.mainFile.version
                addon.folder = item.folder
                this.$set(this.addons, index, addon)
            } catch (err) {
                console.log('err', err)
            }

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
            let addonsPath = store.get('installationFolder') + '/_classic_/Interface/AddOns'

            let path = addonsPath + '/' + item.folder
            // let path = addonsPath + '/this is a test'

            let deletedPaths = await del([path], {
                force: true
            })

            if (deletedPaths.length > 0) {
                this.$delete(this.addons, index)
            }
        },
        // saveBlob (blob, callback) {
        //     let reader = new FileReader()
        //     reader.onload = () => {
        //         if (reader.readyState === 2) {
        //             let buffer = new Buffer(reader.result)
        //             let tempPath = app.getPath('temp') + '/' + Math.random().toString(36).substring(7)

        //             fs.writeFileSync(tempPath, buffer)
        //             callback(tempPath)
        //         }
        //     }

        //     reader.readAsArrayBuffer(blob)
        // }
    },
    mounted () {
        this.fetch()
    }
}
</script>

<style scoped>

</style>
