<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>

<script>
export default {
  name: 'app',
  created () {
    this.$http.interceptors.response.use((res) => res, (err) => {
      if (err.response && err.response.status === 401 && err.config && !err.config.__isRetryRequest) {
        this.$store.dispatch('auth/logout')
          .then(() => {
            this.$router.push('/login')
          })
      }

      return Promise.reject(err)
    })
  }
}
</script>

<style>
html, body, #app {
  height: 100%;
}
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
