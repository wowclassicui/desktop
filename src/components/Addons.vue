<template>
    <b-container fluid>
        <div v-if="mustSpecifyFolder">
            <b-alert class="my-2" show variant="warning">
                {{ $t('app.addons.specifywowfolder') }}
                {{ $t('app.addons.goto') }} <a href="#" @click.prevent="$router.push('settings')">{{ $t('app.addons.settings') }}</a>.
            </b-alert>
        </div>
        <div v-else>
            <!-- Top Actions -->
            <div class="d-flex d-flex-row align-items-center d-flex justify-content-between my-2">
                <b-button-toolbar>
                    <b-button-group>
                        <!-- Refresh -->
                        <b-button @click="handleRefresh" :disabled="scanning">
                            <font-awesome-icon icon="sync" fixed-width :spin="scanning" />
                            {{ $t('app.addons.refresh') }}
                        </b-button>
                        <!-- Update -->
                        <b-button variant="primary" @click="handleUpdateAll" :disabled="updatingAll || updating || needsUpdateCount === 0">
                            <font-awesome-icon v-if="updatingAll" icon="circle-notch" fixed-width spin />
                            <font-awesome-icon v-else icon="download" fixed-width />
                            {{ $t('app.addons.updateall') }}
                        </b-button>
                    </b-button-group>
                </b-button-toolbar>
                <div>
                    <!-- What's up? -->
                    <div v-if="lookingForUpdates">
                        <span class="text-secondary">
                            {{ $t('app.addons.lookingforupdates') }}
                            <font-awesome-icon icon="circle-notch" fixed-width spin />
                        </span>
                    </div>
                    <div v-else-if="updatingAll">
                        <span class="text-secondary">
                            {{ $t('app.addons.updating') }}
                            <font-awesome-icon icon="circle-notch" fixed-width spin />
                        </span>
                    </div>
                    <div v-else-if="needsUpdateCount > 0">
                        <span class="text-secondary">
                            {{ $t('app.addons.updatesavailable', { needsUpdateCount }) }}
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
                        :placeholder="$t('app.typetosearch')"
                    ></b-form-input>
                </div>
            </div>
            <!-- Table -->
            <b-table
                id="table-addons"
                primary-key="id"
                sticky-header="400px"
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
                @row-contextmenu="handleRowContextMenu"
            >
                <!-- Loading -->
                <template v-slot:table-busy>
                    <div class="text-center text-secondary my-4">
                    <b-spinner class="align-middle mr-1"></b-spinner>
                    <strong>{{ $t('app.addons.fetching') }}</strong>
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
                        <!-- Excluded -->
                        <b-button
                            v-if="exclude.includes(data.item.id)"
                            variant="link"
                            size="sm"
                            :disabled="true"
                        >{{ $t('app.addons.excluded') }}</b-button>
                        <!-- Update -->
                        <b-button
                            v-if="data.item.id in needsUpdate && !exclude.includes(data.item.id)"
                            variant="outline-primary"
                            size="sm"
                            class="mr-1"
                            @click="handleUpdate(data.item)"
                            :disabled="needsUpdate[data.item.id].updating || exclude.includes(data.item.id)"
                        >
                            <font-awesome-icon v-if="!needsUpdate[data.item.id].updating" icon="download" fixed-width />
                            <font-awesome-icon v-else icon="circle-notch" fixed-width spin />
                            {{ $t('app.addons.update') }}
                        </b-button>
                        <!-- Remove -->
                        <b-button
                            variant="outline-danger"
                            size="sm"
                            @click="handleRemove(data.item)"
                            :disabled="removing"
                        >
                            <font-awesome-icon icon="trash-alt" size="sm" fixed-width />
                        </b-button>
                    </div>
                </template>
            </b-table>
            <!-- Footer -->
            <div v-if="!scanning && addons.length > 0" class="text-center text-secondary">
                {{ addons.length }} AddOn(s) &middot; {{ $t('app.addons.hint') }}
            </div>
        </div>
    </b-container>
</template>

<script>
import { mapGetters } from 'vuex'
import moment from 'moment'
import addonsMixin from '../mixins/addons'
import { remove, getAddonsPath } from '../utils/addons'
import { toString } from '../utils/string'
const { shell, remote } = require('electron')
const { Menu, MenuItem } = remote

export default {
    mixins: [addonsMixin],
    computed: {
        ...mapGetters({
            scanning: 'installed/loading',
            scanned: 'installed/scanned',
            addons: 'installed/data',

            lookingForUpdates: 'updates/loading',
            needsUpdate: 'updates/data',
            needsUpdateCount: 'updates/count',
            updating: 'updates/updating',

            exclude: 'exclude/list'
        }),
        mustSpecifyFolder () {
            return getAddonsPath() === ''
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
                    label: this.$t('app.addons.name'),
                    sortable: true
                },
                {
                    key: 'downloads',
                    label: this.$t('app.addons.downloads'),
                    sortable: true
                },
                {
                    key: 'mainFile.version',
                    label: this.$t('app.addons.latest'),
                },
                {
                    key: 'mainFile.created_at',
                    label: this.$t('app.addons.updated'),
                    // sortable: true,
                    formatter: 'toDate'
                },
                {
                    key: 'actions',
                    label: ''
                }
            ],
            updatingAll: false,
            removing: false
        }
    },
    watch: {
        addons (to) {
            this.lookForUpdates(to)
        }
    },
    methods: {
        async handleRefresh () {
            if (this.mustSpecifyFolder) {
                return
            }

            let addonsPath = getAddonsPath()

            // Reset "needsUpdate"
            await this.$store.dispatch('updates/reset')

            // Scan addons directory
            await this.$store.dispatch('installed/scan', addonsPath)
        },
        async lookForUpdates (addons) {
            if (this.lookingForUpdates) {
                return
            }

            try {
                /* const needsUpdate = */await this.$store.dispatch('updates/look', addons)
            } catch (err) {
                this.$bvToast.toast('Could not look for updates. Please try again.', {
                    title: 'Whoops!',
                    variant: 'warning',
                    toaster: 'b-toaster-bottom-left',
                    solid: true
                })
            }
        },
        async handleUpdate (item) {
            // Check exclude list
            if (this.exclude.includes(item.id)) {
                return Promise.resolve()
            }

            if (!(item.id in this.needsUpdate)) {
                return Promise.resolve()
            }

            // What if we are already updating this specific addon?
            if (this.needsUpdate[item.id].updating) {
                return Promise.resolve()
            }

            try {
                await this.$store.dispatch('updates/update', item)
            } catch {
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

            this.updatingAll = true

            let promises = []
            for (const id in this.needsUpdate) {
                const addon = this.addons.find((value) => {
                    // Warning: "id" is String, not Integer
                    return value.id == id
                })

                // Should never happen. Doing this for safety.
                if (addon === undefined) {
                    return
                }

                promises.push(this.handleUpdate(addon))
            }

            Promise.all(promises)
                .then(() => {
                    this.updatingAll = false
                })
                .catch(() => {
                    // Will never happen because we're currently never rejecting from "handleUpdate"
                    this.$bvToast.toast('We have had some issues updating your AddOns. Please try again.', {
                        title: 'Whoops!',
                        variant: 'warning',
                        toaster: 'b-toaster-bottom-left',
                        solid: true
                    })
                    this.updatingAll = false
                })
        },
        async handleRemove (item) {
            const confirm = await this.$bvModal.msgBoxConfirm('Please confirm that you want to delete ' + item.name + '.', {
                title: this.$t('app.confirm.title'),
                size: 'sm',
                buttonSize: 'sm',
                okVariant: 'danger',
                okTitle: this.$t('app.confirm.oktitle'),
                cancelTitle: this.$t('app.confirm.canceltitle'),
                footerClass: 'p-2',
                hideHeaderClose: false,
                centered: true
            })

            if (!confirm) {
                return
            }

            this.removing = true

            try {
                let deletedPaths = await remove(item)
                // console.log('deleted paths', deletedPaths)

                if (deletedPaths.length > 0) {
                    this.$store.commit('installed/remove', item)
                    this.$store.dispatch('exclude/remove', item.id)
                }
            } catch {
                this.$bvToast.toast('Could not delete ' + item.name + '. Please try again.', {
                    title: 'Whoops!',
                    variant: 'warning',
                    toaster: 'b-toaster-bottom-left',
                    solid: true
                })
            }

            this.removing = false
        },
        handleRowContextMenu (item, index, event) {
            event.preventDefault()

            let _vm = this

            let isExcluded
            const row = this.$store.getters['exclude/list'].find((id) => {
                return id == item.id
            })
            if (row !== undefined) {
                isExcluded = true
            }

            // Create context menu
            const contextMenu = new Menu()
            contextMenu.append(new MenuItem({
                label: isExcluded ? _vm.$t('app.exclude.remove') : _vm.$t('app.exclude.add'),
                click () {
                    if (isExcluded) {
                        _vm.$store.dispatch('exclude/remove', item.id)
                    } else {
                        _vm.$store.dispatch('exclude/add', item.id)
                    }
                }
            }))
            contextMenu.append(new MenuItem({
                label: _vm.$t('app.contextmenu.webpage'),
                click () {
                    if (!item.links.web) {
                        return
                    }
                    shell.openExternal(item.links.web)
                }
            }))

            contextMenu.popup({ window: remote.getCurrentWindow() })
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
        if (!this.scanned && !this.scanning) {
            // Automatically start 1st addons scan
            this.handleRefresh()
        }
    }
}
</script>
