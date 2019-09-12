<template>
    <b-container fluid>
        <b-row>
            <!-- Filter -->
            <b-col md="6" class="my-1">
                <b-form-group
                    class="mb-0"
                >
                    <b-input-group size="sm">
                        <b-form-input
                            v-model="filter"
                            type="search"
                            placeholder="Type to Search"
                        ></b-form-input>
                        <b-input-group-append>
                            <b-button :disabled="!filter" @click="filter = ''">Clear</b-button>
                        </b-input-group-append>
                    </b-input-group>
                </b-form-group>
            </b-col>
            <!-- Category -->
            <b-col md="6" class="my-1">
                <b-form-group
                    class="mb-0"
                >
                    <b-form-select
                        v-model="category"
                        size="sm"
                        @change="onCategoryChange"
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
            :busy="firstLoading"
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
                <b-button-toolbar>
                    <b-button-group>
                        <!-- Install -->
                        <b-button
                            v-if="data.item.mainFile !== null"
                            size="sm"
                            @click="handleInstall(data.index, data.item)"
                            :disabled="loading || installing"
                        >Install</b-button>
                    </b-button-group>
                </b-button-toolbar>
            </template>
        </b-table>
        <!-- Pagination -->
        <b-button-group>
            <b-button @click="onMore" :disabled="loading || loadingMore || cursor.next === null">
                <font-awesome-icon v-if="loadingMore" icon="sync" spin />
                More
            </b-button>
        </b-button-group>
    </b-container>
</template>

<script>
import { mapGetters } from 'vuex'
import addonsMixin from '../mixins/addons'
import { install } from '../utils/addons'
import categoriesApi from '../api/categories'

export default {
    mixins: [addonsMixin],
    computed: {
        ...mapGetters({
            items: 'addons/data',
            loading: 'addons/loading',
            cursor: 'addons/cursor',
            previous: 'addons/previous'
        })
    },
    // watch: {
    //     cursor (to, from) {
    //         console.log('to', to)
    //         console.log('from', from)
    //     }
    // },
    data () {
        return {
            fields: [
                {
                    key: 'logo',
                    label: ''
                },
                {
                    key: 'id',
                    label: '#',
                    sortable: true
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
            firstLoading: false,
            loadingMore: false,
            installing: false
        }
    },
    methods: {
        onMore () {
            // console.log('before', {
            //     cursor: this.cursor.current,
            //     previous: this.cursor.previous
            // })
            let cursor = this.cursor.next
            let previous = this.cursor.current
            // console.log('after', {
            //     cursor,
            //     previous
            // })

            let _vm = this
            _vm.loadingMore = true
            this.fetch(cursor, previous, () => {
                // done
                _vm.loadingMore = false
            })
        },
        onCategoryChange (value) {

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
                previous
            })
            .then((addons) => {
                console.log('fetched addons', addons.length)

                done()
            })
        }
    },
    mounted () {
        // Fetch only if we don't have any addons
        if (this.cursor.current === null) {
            let _vm = this
            _vm.firstLoading = true
            this.fetch(0, null, () => {
                _vm.firstLoading = false
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
