<template>
    <section id="home" class="h-100">
        <b-navbar type="dark" variant="dark" :sticky="true">
            <b-navbar-brand tag="h1" class="mb-0">
                <img src="@/assets/logo.png" class="d-inline-block align-middle" alt="WoWClassicUI App">
                WoWClassicUI App
            </b-navbar-brand>
            <b-navbar-nav class="ml-auto">
                <!-- Addons -->
                <b-nav-item :to="{ name: 'addons'}" active-class="active">
                    <font-awesome-icon icon="puzzle-piece" fixed-width />
                    {{ $t('app.menu.myaddons') }}
                </b-nav-item>
                <!-- Browse -->
                <b-nav-item :to="{ name: 'browse'}" active-class="active">
                    <font-awesome-icon icon="search" fixed-width />
                    {{ $t('app.menu.browse') }}
                </b-nav-item>
                <!-- User -->
                <b-nav-item-dropdown right no-caret>
                    <template v-slot:button-content>
                        <font-awesome-icon icon="bars" fixed-width />
                    </template>
                    <b-dropdown-item :to="{ name: 'settings'}">{{ $t('app.menu.settings') }}</b-dropdown-item>
                    <b-dropdown-item @click="openWebsite">{{ $t('app.menu.about') }}</b-dropdown-item>
                    <b-dropdown-item @click="openFeedback">{{ $t('app.menu.feedback') }}</b-dropdown-item>
                    <b-dropdown-item @click="logout">{{ $t('app.menu.logout') }}</b-dropdown-item>
                    <b-dropdown-divider></b-dropdown-divider>
                    <b-dropdown-item @click="reload">{{ $t('app.menu.reload') }}</b-dropdown-item>
                    <b-dropdown-item @click="quit">{{ $t('app.menu.quit') }}</b-dropdown-item>
                </b-nav-item-dropdown>
            </b-navbar-nav>
        </b-navbar>
        <router-view></router-view>
    </section>
</template>

<script>
const { shell, remote, app } = require('electron')
const { getCurrentWindow } = remote

export default {
    data () {
        return {
            publicPath: process.env.BASE_URL
        }
    },
    methods: {
        logout () {
            this.$store.dispatch('auth/logout')
                .then(() => {
                    this.$router.push('/login')
                })
        },
        quit () {
            getCurrentWindow().destroy()
            app.quit()
        },
        reload () {
            getCurrentWindow().reload()
        },
        openWebsite () {
            shell.openExternal('https://wowclassicui.com/about')
        },
        openFeedback () {
            shell.openExternal('https://github.com/wowclassicui/feedback/labels/desktop')
        }
    },
    created () {
        // Go to addons route by default
        if (this.$route.name !== 'addons') {
            this.$router.push({
                name: 'addons'
            })
        }
    }
}
</script>
