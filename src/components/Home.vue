<template>
    <div>
        <b-navbar type="dark" variant="dark">
            <b-navbar-nav>
                <b-nav-item href="#" @click="goto('addons')">My Addons</b-nav-item>
                <b-nav-item href="#" @click="goto('browse')">Browse</b-nav-item>
            </b-navbar-nav>
            <b-navbar-nav class="ml-auto">
                <b-nav-item-dropdown text="User" right>
                    <b-dropdown-item href="#" @click.prevent="goto('settings')">Settings</b-dropdown-item>
                    <b-dropdown-item href="#" @click.prevent="logout">Logout</b-dropdown-item>
                </b-nav-item-dropdown>
            </b-navbar-nav>
        </b-navbar>

        <b-container fluid class="my-2">
            <b-alert show variant="info">
                Proof of concept App - go to our website for updates.<br>
                => <a href="https://classic-warcraft.com">https://classic-warcraft.com</a>
            </b-alert>
        </b-container>

        <router-view></router-view>
    </div>
</template>

<script>
export default {
    methods: {
        goto (route) {
            this.$router.push(route)
        },
        logout () {
            this.$store.dispatch('auth/logout')
                .then(() => {
                    this.$router.push('/login')
                })
        }
    }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
