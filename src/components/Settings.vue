<template>
    <b-container class="my-2">
        <!-- App -->
        <div v-if="appVersion !== null" class="text-center text-secondary">
            <p>Classic Warcraft App <strong>v{{ appVersion }}</strong></p>
        </div>
        <b-row>
            <b-col>
                <!-- WoW Folder -->
                <b-form-group
                    :label="$t('app.settings.wowfolderlabel')"
                    label-for="wowFolder"
                >
                    <b-input-group>
                        <b-input-group-text slot="prepend">
                            <font-awesome-icon v-if="wowFolderIsValid" icon="check-circle" fixed-width class="text-success" />
                            <font-awesome-icon v-else icon="times-circle" fixed-width class="text-danger" />
                            {{ $t('app.settings.wowfolder') }}
                        </b-input-group-text>
                        <b-form-input
                            id="wowFolder"
                            v-model="wowFolder"
                            placeholder="D:\World of Warcraft"
                        ></b-form-input>
                        <b-input-group-append>
                            <b-button text="Browse" variant="secondary" @click="handleBrowse">{{ $t('app.settings.browse') }}</b-button>
                        </b-input-group-append>
                    </b-input-group>
                </b-form-group>
            </b-col>
        </b-row>
        <hr>
        <b-row>
            <b-col>
                <!-- Open At Login -->
                <b-form-group
                    :label="$t('app.settings.runatstartuplabel')"
                    label-for="openAtLogin"
                >
                    <b-form-checkbox
                        id="openAtLogin"
                        v-model="openAtLogin"
                        name="openAtLogin"
                    >
                    {{ $t('app.settings.runatstartup') }}
                    </b-form-checkbox>
                </b-form-group>
            </b-col>
        </b-row>
        <hr>
        <b-row>
            <b-col>
                <!-- Look for updates -->
                <b-form-group
                    :label="$t('app.settings.lookforupdateslabel')"
                    label-for="lookForUpdates"
                >
                    <b-form-checkbox
                        id="lookForUpdates"
                        v-model="lookForUpdates"
                        name="lookForUpdates"
                    >
                    {{ $t('app.settings.lookforupdates') }}
                    </b-form-checkbox>
                </b-form-group>
            </b-col>
            <b-col>
                <!-- Check Interval -->
                <b-form-group
                    :label="$t('app.settings.checkintervallabel')"
                    label-for="checkInterval"
                >
                    <b-form-select
                        id="checkInterval"
                        v-model="checkInterval"
                        :options="checkIntervalOptions"
                    ></b-form-select>
                </b-form-group>
            </b-col>
        </b-row>
        <b-row>
            <b-col>
                <em>&mdash; {{ $t('app.settings.lastcheck', { lastCheckFormatted }) }}</em>
            </b-col>
        </b-row>
        <!-- <b-row>
            <b-col cols="6">
                <b-form-group
                    label="Select the update channel"
                    label-for="channel"
                >
                    <b-form-select
                        id="channel"
                        v-model="channel"
                        :options="channelOptions"
                    ></b-form-select>
                </b-form-group>
            </b-col>
        </b-row> -->
        <hr>
        <b-row>
            <b-col cols="6">
                <!-- Minimize to tray -->
                <b-form-group
                    :label="$t('app.settings.minimizetotraylabel')"
                    label-for="minimizeToTray"
                >
                    <b-form-checkbox
                        id="minimizeToTray"
                        v-model="minimizeToTray"
                        name="minimizeToTray"
                    >
                    {{ $t('app.settings.minimizetotray') }}
                    </b-form-checkbox>
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
</template>

<script>
import moment from 'moment'
const Store = require('electron-store')
const store = new Store()
const { remote, ipcRenderer } = require('electron')
const { app, dialog } = remote
const fs = remote.require('fs')
const path = remote.require('path')

export default {
    computed: {
        lastCheckFormatted () {
            if (this.lastCheck === null) {
                return 'never'
            }

            return moment(this.lastCheck).fromNow()
        }
    },
    data () {
        return {
            appVersion: null,
            wowFolder: '',
            wowFolderIsValid: true,
            openAtLogin: false,
            lookForUpdates: true,
            checkInterval: 3600,
            checkIntervalOptions: [
                // { value: 60, text: this.$t('app.settings.checkinterval.everyminute') },
                { value: 3600, text: this.$t('app.settings.checkinterval.everyhour') },
                { value: 43200, text: this.$t('app.settings.checkinterval.everytwelvehours') },
                { value: 86400, text: this.$t('app.settings.checkinterval.everyday') }
            ],
            lastCheck: null,
            // channel: 'release',
            // channelOptions: [
            //     { value: 'release', text: 'Release (recommended)' },
            //     { value: 'beta', text: 'Beta' },
            //     { value: 'alpha', text: 'Alpha' }
            // ],
            minimizeToTray: true,
            langs: [
                { value: 'en', text: 'English' },
                { value: 'fr', text: 'Français'}
            ]
        }
    },
    watch: {
        openAtLogin (to) {
            app.setLoginItemSettings({
                openAtLogin: to,
                openAsHidden: true
            })
        },
        lookForUpdates (to) {
            store.set('lookForUpdates', to)

            ipcRenderer.send('checkIntervalUpdate', {
                lookForUpdates: to,
                checkInterval: this.checkInterval
            })
        },
        checkInterval (to) {
            store.set('checkInterval', to)

            ipcRenderer.send('checkIntervalUpdate', {
                lookForUpdates: this.lookForUpdates,
                checkInterval: to
            })
        },
        // channel (to) {
        //     store.set('channel', to)
        // },
        minimizeToTray (to) {
            store.set('minimizeToTray', to)
        },
        '$i18n.locale' (to) {
            store.set('locale', to)
            moment.locale(to)
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

            this.wowFolder = dir.filePaths[0]

            this.wowFolderIsValid = await this.checkWowFolder()

            if (!this.wowFolderIsValid) {
                store.delete('installationFolder')
                return
            }

            store.set('installationFolder', this.wowFolder)
        },
        initLoginItemSettings () {
            const settings = app.getLoginItemSettings()
            this.openAtLogin = settings.openAtLogin
        },
        async checkWowFolder () {
            if (this.wowFolder === null) {
                return Promise.resolve(false)
            }

            const executablePath = path.resolve(this.wowFolder, '_classic_', 'Wow.exe')

            return new Promise((resolve/* , reject */) => {
                fs.access(executablePath, (err) => {
                    resolve(err ? false : true)
                })
            })
        }
    },
    mounted () {
        this.appVersion = app.getVersion()

        // TODO: Init those values at first launch?
        this.wowFolder = store.get('installationFolder', null)
        this.lookForUpdates = store.get('lookForUpdates', true)
        this.checkInterval = store.get('checkInterval', 3600)
        this.lastCheck = store.get('lastCheck', null)
        // this.channel = store.get('channel', 'release')
        this.minimizeToTray = store.get('minimizeToTray', true)

        this.initLoginItemSettings()

        this.checkWowFolder().then((isValid) => {
            this.wowFolderIsValid = isValid
        })
    }
}
</script>
