<template>
    <div>
        <b-container class="my-2">
            <!-- WoW Folder -->
            <b-form-group
                label="Specify your WoW installation folder"
                label-for="wowFolder"
            >
                <b-input-group>
                    <b-input-group-text slot="prepend">WoW Folder</b-input-group-text>
                    <b-form-input
                        id="wowFolder"
                        v-model="wowFolder"
                        placeholder="D:\World of Warcraft"
                    ></b-form-input>
                    <b-input-group-append>
                        <b-button text="Browse" variant="secondary" @click="handleBrowse">Browse</b-button>
                    </b-input-group-append>
                </b-input-group>
            </b-form-group>

            <hr>

            <!-- Open At Login -->
            <b-form-group
                label="Run at Startup (hidden)"
                label-for="openAtLogin"
            >
                <b-form-checkbox
                    id="openAtLogin"
                    v-model="openAtLogin"
                    name="openAtLogin"
                >
                Run at Startup
                </b-form-checkbox>
            </b-form-group>

            <hr>

            <b-row>
                <b-col>
                    <!-- Look for updates -->
                    <b-form-group
                        label="Look for addon updates in the background"
                        label-for="lookForUpdates"
                    >
                        <b-form-checkbox
                            id="lookForUpdates"
                            v-model="lookForUpdates"
                            name="lookForUpdates"
                        >
                        Look for updates
                        </b-form-checkbox>
                    </b-form-group>
                </b-col>
                <b-col>
                    <!-- Interval -->
                    <b-form-group
                        label="The interval for checking addon updates"
                        label-for="interval"
                    >
                        <b-form-select
                            id="interval"
                            v-model="interval"
                            :options="intervalOptions"
                        ></b-form-select>
                    </b-form-group>
                </b-col>
            </b-row>

            <hr>

            <b-row>
                <b-col cols="6">
                    <!-- Locale -->
                    <b-form-group
                        label="Language"
                        label-for="locale"
                    >
                        <b-form-select
                            id="locale"
                            v-model="$i18n.locale"
                            :options="langs"
                        ></b-form-select>
                    </b-form-group>
                </b-col>
            </b-row>

        </b-container>
    </div>
</template>

<script>
const Store = require('electron-store')
const store = new Store()
const { app, dialog } = require('electron').remote

export default {
    data () {
        return {
            wowFolder: '',
            openAtLogin: false,
            lookForUpdates: true,
            interval: 3,
            intervalOptions: [
                { value: 1, text: 'every hour' },
                { value: 2, text: 'every 12 hours' },
                { value: 3, text: 'every day' },
                { value: 4, text: 'every week' }
            ],
            langs: [
                { value: 'en', text: 'English' },
                { value: 'fr', text: 'Français'}
            ]
        }
    },
    watch: {
        openAtLogin (to, from) {
            app.setLoginItemSettings({
                openAtLogin: to,
                openAsHidden: true
            })
        },
        lookForUpdates (to, from) {
            store.set('lookForUpdates', to)
        },
        interval (to, from) {
            store.set('checkInterval', to)
        },
        '$i18n.locale' (to, from) {
            console.log('waaatch', to)
            store.set('locale', to)
        }
    },
    methods: {
        async handleBrowse () {
            let dir = await dialog.showOpenDialog({
                properties: ['openDirectory']
            })

            if (dir.canceled) {
                return
            }

            this.$store.commit('installed/reset')

            let wowFolder = dir.filePaths[0]
            if (store.get('installaitonFolder') !== wowFolder) {
                store.set('installationFolder', wowFolder)
                this.wowFolder = wowFolder
            }
        },
        initLoginItemSettings () {
            const settings = app.getLoginItemSettings()
            this.openAtLogin = settings.openAtLogin
        }
    },
    mounted () {
        // TODO: Init those values at first launch
        this.wowFolder = store.get('installationFolder')
        this.lookForUpdates = store.get('lookForUpdates', true)
        this.interval = store.get('checkInterval', 3)
        if (store.has('locale')) {
            this.$i18n.locale = store.get('locale')
        }
        this.initLoginItemSettings()
    }
}
</script>
