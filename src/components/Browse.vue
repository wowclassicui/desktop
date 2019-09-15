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
                        placeholder="Type to Search"
                    ></b-form-input>
                </b-form-group>
            </b-col>
            <b-col class="d-sm-none d-md-block md-4">
                <div class="text-center text-secondary">
                    <div v-if="searching">
                        Searching
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
                        <option :value="null">Select a Category</option>
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
            sticky-header="400px"
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
        >
            <!-- Loading -->
            <template v-slot:table-busy>
                <div class="text-center text-secondary my-2">
                <b-spinner class="align-middle mr-1"></b-spinner>
                <strong>Loading...</strong>
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
                        <font-awesome-icon icon="download" fixed-width />
                        Install
                    </b-button>
                </div>
            </template>
        </b-table>
        <!-- Pagination -->
        <b-button-group>
            <b-button @click="onMore" :disabled="loading || loadingMore || cursor.next === null">
                <b-spinner v-if="loadingMore" small type="grow" class="mr-1"></b-spinner>
                <span v-if="cursor.next !== null">More</span>
                <span v-else>No more</span>
            </b-button>
        </b-button-group>
    </b-container>
</template>

<script>
import { mapGetters } from 'vuex'
import addonsMixin from '../mixins/addons'
import { install } from '../utils/addons'
import categoriesApi from '../api/categories'
import { debounce } from 'lodash'

export default {
    mixins: [addonsMixin],
    computed: {
        ...mapGetters({
            items: 'addons/data',
            loading: 'addons/loading',
            cursor: 'addons/cursor',
            previous: 'addons/previous',
            installed: 'installed/data'
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
                    label: 'Name',
                    sortable: true
                },
                {
                    key: 'downloads',
                    label: 'Downloads',
                    sortable: true
                },
                {
                    key: 'category.name',
                    label: 'Category',
                    sortable: true
                },
                {
                    key: 'mainFile.version',
                    label: 'Latest'
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
            installing: false
        }
    },
    watch: {
        filter: debounce (function (e) {
            let _vm = this
            this.searching = true
            this.fetch(0, null, () => {
                _vm.searching = false
            })
        }, 500)
    },
    methods: {
        onMore () {
            let cursor = this.cursor.next
            let previous = this.cursor.current

            let _vm = this
            _vm.loadingMore = true
            this.fetch(cursor, previous, () => {
                // done
                _vm.loadingMore = false
            })
        },
        handleCategoryChange (value) {
            let _vm = this
            this.busy = true
            this.fetch(0, null, () => {
                _vm.busy = false
            })
        },
        canInstall (item) {
            // console.log('canInstall id', item.id)

            if (item.mainFile === null) {
                return false
            }

            let id = item.id

            let found = this.installed.find((element) => {
                if (element.id === id) {
                    return true
                }
            })

            // If undefined, this means the addon is no yet installed,
            // therefor we are allowing to install it
            return found === undefined
        },
        async handleInstall (index, item) {
            if (!item.mainFile.id) {
                return
            }

            this.installing = true
            let res = await install(item.mainFile.id)
            this.installing = false
        },
        fetch (cursor, previous, done) {
            this.$store.dispatch('addons/fetch', {
                limit: this.limit,
                cursor,
                previous,
                search: this.filter,
                category: this.category
            })
            .then((addons) => {
                done()
            })
        }
    },
    mounted () {
        // Fetch only if we don't have any addons
        if (this.cursor.current === null) {
            let _vm = this
            _vm.busy = true
            this.fetch(0, null, () => {
                _vm.busy = false
            })
        }
    },
    created () {
        categoriesApi.index()
            .then((res) => {
                this.categories = res.data.data
            })
    }
}
</script>
