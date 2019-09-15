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
            <div class="d-flex d-flex-row align-items-center d-flex justify-content-between my-2">
                <b-button-toolbar>
                    <b-button-group>
                        <!-- Fetch -->
                        <b-button @click="handleFetch" :disabled="scanning">
                            <font-awesome-icon icon="sync" fixed-width :spin="scanning" />
                            Fetch
                        </b-button>
                        <!-- Update -->
                        <b-button variant="primary" @click="handleUpdateAll" :disabled="updating || needsUpdateCount === 0">
                            <font-awesome-icon v-if="!updating" icon="download" fixed-width />
                            <font-awesome-icon v-else icon="circle-notch" fixed-width spin />
                            Update All
                        </b-button>
                    </b-button-group>
                </b-button-toolbar>
                <div>
                    <!-- Looking for updates -->
                    <div v-if="lookingForUpdates">
                        <span class="text-secondary">
                            Looking for updates..
                            <font-awesome-icon icon="circle-notch" fixed-width spin />
                        </span>
                    </div>
                    <div v-else-if="updating">
                        <span class="text-secondary">
                            Updating..
                            <font-awesome-icon icon="circle-notch" fixed-width spin />
                        </span>
                    </div>
                    <div v-else-if="needsUpdateCount > 0">
                        <span class="text-secondary">
                            {{ needsUpdateCount }} update(s) available
                        </span>
                    </div>
                </div>
                <div>
                    <!-- Search -->
                    <b-form-input
                        v-model="filter"
                        type="search"
                        size="sm"
                        id="filterInput"
                        placeholder="Type to Search"
                    ></b-form-input>
                </div>
            </div>
            <!-- Table -->
            <b-table
                id="table-addons"
                sticky-header="410px"
                striped
                hover
                head-variant="light"
                borderless
                show-empty
                :items="addons"
                :fields="fields"
                :busy="scanning"
                :sort-by.sync="sortBy"
                :sort-desc.sync="sortDesc"
                :sort-compare="sortCompare"
                :filter="filter"
                :filter-included-fields="filterIncludedFields"
                filter-debounce="400"
            >
                <!-- Loading -->
                <template v-slot:table-busy>
                    <div class="text-center text-secondary my-2">
                    <b-spinner class="align-middle mr-1"></b-spinner>
                    <strong>Fetching..</strong>
                    </div>
                </template>
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
                            v-if="data.item.id in needsUpdate"
                            variant="outline-primary"
                            size="sm"
                            class="mr-1"
                            @click="handleUpdate(data.index, data.item)"
                            :disabled="needsUpdate[data.item.id].updating"
                        >
                            <font-awesome-icon v-if="!needsUpdate[data.item.id].updating" icon="download" fixed-width />
                            <font-awesome-icon v-else icon="circle-notch" fixed-width spin />
                            Update
                        </b-button>
                        <!-- Remove -->
                        <b-button
                            variant="outline-danger"
                            size="sm"
                            @click="handleRemove(data.index, data.item)"
                            :disabled="removing"
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
import { mapGetters } from 'vuex'
import addonsMixin from '../mixins/addons'
import { getWowPath } from '../utils/path'
import { update, remove, getHash, getAddonsPath } from '../utils/addons'
import { toString } from '../utils/string'
import moment from 'moment'

export default {
    mixins: [addonsMixin],
    computed: {
        ...mapGetters({
            scanning: 'installed/loading',
            scanned: 'installed/scanned',
            addons: 'installed/data'
        }),
        mustSpecifyFolder () {
            return getWowPath() === ''
        }
    },
    data () {
        return {
            sortBy: 'name',
            sortDesc: false,
            filter: null,
            filterIncludedFields: ['name'],
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
                    key: 'mainFile.version',
                    label: 'Latest',
                },
                {
                    key: 'mainFile.created_at',
                    label: 'Updated',
                    // sortable: true,
                    formatter: 'toDate'
                },
                {
                    key: 'actions',
                    label: ''
                }
            ],
            needsUpdate: {},
            needsUpdateCount: 0,
            lookingForUpdates: false,
            updating: false,
            removing: false
        }
    },
    watch: {
        addons (to) {
            this.lookForUpdates(to)
        }
    },
    methods: {
        async handleFetch () {
            if (this.mustSpecifyFolder) {
                return
            }

            let addonsPath = getAddonsPath()

            // Scanning AddOns directory
            await this.$store.dispatch('installed/scan', addonsPath)
        },
        lookForUpdates (addons) {
            if (this.lookingForUpdates) {
                return
            }

            let _vm = this

            // Looking for updates
            this.lookingForUpdates = true
            // Reset needsUpdate array
            this.needsUpdate = {}
            this.needsUpdateCount = 0
            Promise.all(addons.map(async (addon, index) => {
                if (addon.mainFile === null) {
                    // No main file here, skipping for now
                    console.log('no main file for', addon.name)
                    return
                }

                // Let's define what we're looking for
                let folders = []
                if (addon.folders && addon.folders.length > 0) {
                    folders = addon.folders.map(a => a.name)
                } else {
                    folders.push(addon.name)
                }

                let { hash } = await getHash(folders)

                let row = {
                    id: addon.id,
                    hash
                }

                if (row.hash !== addon.mainFile.hash) {
                    _vm.needsUpdate[addon.id] = {
                        index,
                        updating: false
                    }
                    _vm.needsUpdateCount++
                }

                return row
            }))
            .then((rows) => {
                this.lookingForUpdates = false
            })
            .catch((err) => {
                this.$bvToast.toast('Could not look for updates. Please try again.', {
                    title: 'Whoops!',
                    variant: 'warning',
                    toaster: 'b-toaster-bottom-left',
                    solid: true
                })
                this.lookingForUpdates = false
            })
        },
        async handleUpdate (index, item) {
            if (!(item.id in this.needsUpdate)) {
                return Promise.resolve()
            }
            let row = this.needsUpdate[item.id]
            if (row.updating) {
                return Promise.resolve()
            }

            console.log('updating..', item.name)

            row.updating = true
            let needsUpdate = {}
            needsUpdate[item.id] = row
            this.needsUpdate = Object.assign({}, this.needsUpdate, needsUpdate)

            try {
                let result = await update(item)
                this.$delete(this.needsUpdate, item.id)
                this.needsUpdateCount--
            } catch (err) {
                this.$bvToast.toast('Could not update ' + item.name + '. Please try again.', {
                    title: 'Whoops!',
                    variant: 'warning',
                    toaster: 'b-toaster-bottom-left',
                    solid: true
                })
            }

            return Promise.resolve()
        },
        handleUpdateAll () {
            if (this.needsUpdateCount === 0) {
                return
            }

            this.updating = true
            let promises = []
            Object.values(this.needsUpdate).forEach((row) => {
                promises.push(this.handleUpdate(row.index, this.addons[row.index]))
            })

            Promise.all(promises)
                .then(() => {
                    this.updating = false
                })
                .catch((err) => {
                    this.$bvToast.toast('We have had some issues updating your AddOns. Please try again.', {
                        title: 'Whoops!',
                        variant: 'warning',
                        toaster: 'b-toaster-bottom-left',
                        solid: true
                    })
                    this.updating = false
                })
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
        toDate (value) {
            return moment(value).fromNow()
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
        if (! this.scanned) {
            // Automatically start 1st addons scan
            this.handleFetch()
        } else {
            // Only look for updates once scan is done
            this.lookForUpdates(this.addons)
        }
    }
}
</script>
