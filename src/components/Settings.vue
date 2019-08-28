<template>
    <div>
        <b-container fluid>
            <h1>Settings</h1>

            <!-- WoW Folder -->
            <b-input-group>
                <b-input-group-text slot="prepend">WoW Folder</b-input-group-text>
                <b-form-input v-model="wowFolder"></b-form-input>

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
    computed: {
        wowFolder () {
            return store.get('installationFolder')
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

            store.set('installationFolder', dir.filePaths[0])
        }
    }
}
</script>

<style>

</style>
