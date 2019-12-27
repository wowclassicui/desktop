<template>
    <b-container fluid>
        <b-row align-v="center" class="my-2">
            <!-- Filter -->
            <b-col sm="6" md="4">
                <b-form-group
                    class="mb-0 mb-2 mb-sm-0"
                >
                    <b-form-input
                        v-model="filter"
                        type="search"
                        size="sm"
                        :placeholder="$t('app.typetosearch')"
                    ></b-form-input>
                </b-form-group>
            </b-col>
            <b-col class="d-sm-none d-md-block md-4">
                <div class="text-center text-secondary">
                    <div v-if="searching">
                        {{ $t('app.browse.searching') }}
                        <font-awesome-icon icon="circle-notch" fixed-width spin />
                    </div>
                </div>
            </b-col>
            <!-- Category -->
            <b-col sm="6" md="4">
                <b-form-group
                    class="mb-0"
                >
                    <b-form-select
                        v-model="category"
                        size="sm"
                        @change="handleCategoryChange"
                    >
                        <option :value="null">{{ $t('app.browse.categoryselect') }}</option>
                        <option
                            v-for="category in categories"
                            :key="category.id"
                            :value="category.id"
                        >{{ category.name }}</option>
                    </b-form-select>
                </b-form-group>
            </b-col>
        </b-row>
        <!-- Table -->
        <b-table
            primary-key="id"
            sticky-header="390px"
            striped
            hover
            head-variant="light"
            borderless
            show-empty
            :items="items"
            :fields="fields"
            :busy="busy"
            :sort-by.sync="sortBy"
            :sort-desc.sync="sortDesc"
            @row-contextmenu="handleRowContextMenu"
        >
            <!-- Loading -->
            <template v-slot:table-busy>
                <div class="text-center text-secondary my-4">
                <b-spinner class="align-middle mr-1"></b-spinner>
                <strong>{{ $t('app.loading') }}</strong>
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
                    <!-- Install -->
                    <b-button
                        v-if="canInstall(data.item)"
                        size="sm"
                        variant="outline-primary"
                        @click="handleInstall(data.index, data.item)"
                        :disabled="loading || installing"
                    >
                        <font-awesome-icon v-if="isInstallingAddon(data.item)" icon="circle-notch" fixed-width spin />
                        <font-awesome-icon v-else icon="download" fixed-width />
                        {{ $t('app.browse.install') }}
                    </b-button>
                </div>
            </template>
        </b-table>
        <!-- Pagination -->
        <b-button-group>
            <b-button @click="onMore" :disabled="loading || loadingMore || cursor.next === null">
                <b-spinner v-if="loadingMore" small type="grow" class="mr-1"></b-spinner>
                <span v-if="cursor.next !== null">{{ $t('app.browse.more') }}</span>
                <span v-else>{{ $t('app.browse.nomore') }}</span>
            </b-button>
        </b-button-group>
    </b-container>
</template>

<script>
import { mapGetters } from 'vuex'
import addonsMixin from '../mixins/addons'
import categoriesApi from '../api/categories'
import { debounce } from 'lodash'
const { shell, remote } = require('electron')
const { Menu, MenuItem } = remote

export default {
    mixins: [addonsMixin],
    computed: {
        ...mapGetters({
            items: 'addons/data',
            loading: 'addons/loading',
            cursor: 'addons/cursor',
            previous: 'addons/previous',
            installed: 'installed/data',
            installing: 'installed/installing'
        })
    },
    data () {
        return {
            sortBy: 'downloads',
            sortDesc: true,
            fields: [
                {
                    key: 'logo',
                    label: ''
                },
                {
                    key: 'name',
                    label: this.$t('app.browse.name'),
                    sortable: true
                },
                {
                    key: 'downloads',
                    label: this.$t('app.browse.downloads'),
                    sortable: true
                },
                {
                    key: 'category.name',
                    label: this.$t('app.browse.category'),
                    sortable: true
                },
                {
                    key: 'mainFile.version',
                    label: this.$t('app.browse.latest')
                },
                {
                    key: 'actions',
                    label: ''
                }
            ],
            limit: 10,
            filter: '',
            category: null,
            categories: [],
            busy: false,
            searching: false,
            loadingMore: false,
            // installing: false,
            installingId: null
        }
    },
    watch: {
        filter: debounce (function () {
            const _vm = this
            this.searching = true
            this.fetch(0, null, () => {
                _vm.searching = false
            })
        }, 500)
    },
    methods: {
        onMore () {
            const cursor = this.cursor.next
            const previous = this.cursor.current

            const _vm = this
            _vm.loadingMore = true
            this.fetch(cursor, previous, (/* addons */) => {
                // done
                _vm.loadingMore = false
            })
        },
        handleCategoryChange () {
            const _vm = this
            this.busy = true
            this.fetch(0, null, () => {
                _vm.busy = false
            })
        },
        canInstall (item) {
            if (item.mainFile === null) {
                return false
            }

            const id = item.id

            const found = this.installed.find((element) => {
                if (element.id === id) {
                    return true
                }
            })

            // If undefined, this means the addon is no yet installed,
            // therefor we are allowing to install it
            return found === undefined
        },
        isInstallingAddon (item) {
            return this.installingId === item.id
        },
        async handleInstall (index, item) {
            if (!item.mainFile.id) {
                return
            }

            this.installingId = item.id

            try {
                /* const result = */await this.$store.dispatch('installed/install', item)
            } catch (err) {
                this.$bvToast.toast('Could not install ' + item.name + '. Please try again.', {
                    title: 'Whoops!',
                    variant: 'warning',
                    toaster: 'b-toaster-bottom-left',
                    solid: true
                })
            }

            this.installingId = null

            Promise.resolve()
        },
        handleRowContextMenu (item, index, event) {
            event.preventDefault()

            let _vm = this

            const contextMenu = new Menu()
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
        fetch (cursor, previous, done) {
            this.$store.dispatch('addons/fetch', {
                limit: this.limit,
                cursor,
                previous,
                search: this.filter,
                category: this.category
            })
            // .then((/* addons */) => {
            //     done()
            // })
            .then(done)
        }
    },
    mounted () {
        const _vm = this
        _vm.busy = true
        this.fetch(0, null, () => {
            _vm.busy = false
        })
    },
    created () {
        categoriesApi.index()
            .then((res) => {
                this.categories = res.data.data
            })
    }
}
</script>
