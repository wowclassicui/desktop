<template>
    <b-container fluid>
        <div v-if="mustSpecifyFolder">
            <b-alert show variant="warning">
                Please specify your WoW Classic installation folder.
                Check out <a href="#" @click.prevent="$router.push('settings')">Settings</a>.
            </b-alert>
        </div>
        <div v-else>
            <!-- Top Actions -->
            <b-button-toolbar class="my-2">
                <b-button-group>
                    <!-- Fetch -->
                    <b-button @click="handleFetch" :disabled="fetching">
                        <font-awesome-icon icon="sync" fixed-width :spin="fetching" />
                        Fetch
                    </b-button>
                    <!-- Update -->
                    <b-button variant="primary" @click="handleUpdateAll" :disabled="updating">
                        <font-awesome-icon icon="download" fixed-width :pulse="updating" />
                        Update All
                    </b-button>
                </b-button-group>
            </b-button-toolbar>
            <!-- Table -->
            <b-table
                id="table-addons"
                sticky-header="400px"
                striped
                hover
                head-variant="light"
                borderless
                show-empty
                :items="addons"
                :fields="fields"
                :sort-by.sync="sortBy"
                :sort-desc.sync="sortDesc"
                :sort-compare="sortCompare"
            >
                <!-- Logo -->
                <template v-slot:cell(logo)="data">
                    <img
                        class="img-fluid"
                        style="max-width: 32px"
                        :src="getAddonLogoUrl(data.item)"
                        :alt="data.item.slug"
                    >
                </template>
                <!-- Actions -->
                <template v-slot:cell(actions)="data">
                    <div class="text-right">
                        <!-- Update -->
                        <b-button
                            v-if="data.item.mainFile !== null && data.item.mainFile.hash !== data.item.meta.localHash"
                            variant="outline-primary"
                            size="sm"
                            class="mr-1"
                            @click="handleUpdate(data.index, data.item)"
                            :disabled="updating || fetching"
                        >
                            <font-awesome-icon icon="download" size="sm" fixed-width />
                            Update
                        </b-button>
                        <!-- Remove -->
                        <b-button
                            variant="outline-danger"
                            size="sm"
                            @click="handleRemove(data.index, data.item)"
                            :disabled="removing || fetching"
                        >
                            <font-awesome-icon icon="trash-alt" size="sm" fixed-width />
                        </b-button>
                    </div>
                </template>
            </b-table>
        </div>
    </b-container>
</template>

<script>
import addons from '../api/addons'
import addonsMixin from '../mixins/addons'
import { getWowPath } from '../utils/path'
import { install, update, remove, getHash, getAddonsPath, scanAddonsDir } from '../utils/addons'
import { toString } from '../utils/string'

export default {
    mixins: [addonsMixin],
    computed: {
        mustSpecifyFolder () {
            return getWowPath() === ''
        }
    },
    data () {
        return {
            sortBy: 'needs_update',
            sortDesc: true,
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
            loading: false,
            fetching: false,
            updating: false,
            removing: false
        }
    },
    methods: {
        async handleFetch () {
            if (this.mustSpecifyFolder) {
                return
            }

            // Reset
            this.addons = []

            let _vm = this
            this.fetching = true

            try {
                let addonsPath = getAddonsPath()

                console.log('scanning addons dir..', addonsPath)

                let folders = await scanAddonsDir(addonsPath)

                if (folders.length === 0) {
                    // Nothing to work with, exiting
                    return
                }

                console.log('fetching api for matches..')

                let res = await addons.findAll(folders)

                if (!res.data || res.data.data.length === 0) {
                    return
                }

                let promises = []
                res.data.data.forEach((addon) => {
                    console.log('scanning', addon.name, addon.folders)

                    promises.push(new Promise(async (resolve, reject) => {
                        let row = addon

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

                        let { hash, crcPool, files } = await getHash(folders)

                        row.meta = {
                            localHash: hash
                        }

                        // local crc32: crcPool
                        // remote crc32: row.mainFile.crc

                        console.log('localHash', row.meta.localHash)
                        console.log('remoteHash', row.mainFile.hash)

                        _vm.addons.push(row)
                        resolve(row)
                    }))
                })

                Promise.all(promises)
                    .then((addons) => {
                        console.log('all done fetching stuff!')
                        _vm.fetching = false
                    })
                    .catch((errors) => {
                        // Should never reject. But who knows.
                        console.log('fetchPromises catch', errors)
                        _vm.fetching = false
                    })
            } catch (err) {
                this.fetching = false
                // throw err // Re-throw
                console.log('fatal', err)
            }
        },
        async handleUpdate (index, item) {
            this.updating = true

            console.log('updating..', item.name)

            try {
                let result = await update(item)

                console.log('update done, now fetching addon status again')

                let res = await addons.show(item.id, {
                    include: 'mainFile,folders'
                })
                let addon = res.data.data

                addon.meta = {
                    localHash: addon.mainFile ? addon.mainFile.hash : null
                }

                this.$set(this.addons, index, addon)
            } catch (err) {
                console.log('failed to update?', err)
            }

            this.updating = false
        },
        async handleUpdateAll () {
            console.log('updating all..')
        },
        async handleRemove (index, item) {
            this.removing = true

            console.log('starting to delete some stuff..')

            try {
                let deletedPaths = await remove(item)

                console.log('deleted paths', deletedPaths)

                if (deletedPaths.length > 0) {
                    this.$delete(this.addons, index)
                }
            } catch (err) {
                console.log('failed to remove?', err)
            }

            this.removing = false
        },
        sortCompare (aRow, bRow, key, sortDesc, formatter, compareOptions, compareLocale) {
            const a = aRow[key]
            const b = bRow[key]

            // Determine if a or b needs update..
            // console.log('a', a)
            // console.log('b', b)

            if (
                (typeof a === 'number' && typeof b === 'number') ||
                (a instanceof Date && b instanceof Date)
            ) {
                // If both compared fields are native numbers or both are native dates
                return a < b ? -1 : a > b ? 1 : 0
            } else {
                // Otherwise stringify the field data and use String.prototype.localeCompare
                return toString(a).localeCompare(toString(b), compareLocale, compareOptions)
            }
        }
    },
    mounted () {
        this.handleFetch()
    }
}
</script>
