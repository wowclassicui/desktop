<template>
    <div>
        <b-container fluid>
            <!-- WoW Folder -->
            <b-input-group>
                <b-input-group-text slot="prepend">WoW Folder</b-input-group-text>
                <b-form-input v-model="wowFolder" placeholder="D:\World of Warcraft"></b-form-input>
                <b-input-group-append>
                    <b-button text="Browse" variant="secondary" @click="onBrowse">Browse</b-button>
                </b-input-group-append>
            </b-input-group>
        </b-container>
    </div>
</template>

<script>
const Store = require('electron-store')
const store = new Store()
const { dialog } = require('electron').remote

export default {
    data () {
        return {
            wowFolder: ''
        }
    },
    methods: {
        async onBrowse () {
            let dir = await dialog.showOpenDialog({
                properties: ['openDirectory']
            })

            if (dir.canceled) {
                return
            }

            let wowFolder = dir.filePaths[0]
            store.set('installationFolder', wowFolder)
            this.wowFolder = wowFolder
        }
    },
    mounted () {
        this.wowFolder = store.get('installationFolder')
    }
}
</script>
