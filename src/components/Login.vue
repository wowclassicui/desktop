<template>
    <b-container class="h-100">
        <b-row class="justify-content-md-center h-100" align-v="center">
            <b-col cols="7">
                <h2>
                    {{ $t('app.login.pleaselogin') }}<br>
                    <small class="text-muted">{{ $t('app.login.or') }} <b-link @click="handleCreateAccount">{{ $t('app.login.createanaccount') }}</b-link></small>
                </h2>
                <hr>
                <b-form @submit.prevent="handleSubmit">
                    <!-- Email -->
                    <b-form-group id="input-group-1" :label="$t('app.login.emaillabel')" label-for="input-1">
                        <b-form-input id="input-1" v-model="form.email" type="email" required :placeholder="$t('app.login.emailplaceholder')">
                        </b-form-input>
                    </b-form-group>
                    <!-- Password -->
                    <b-form-group id="input-group-2" :label="$t('app.login.passwordlabel')" label-for="input-2">
                        <b-form-input id="input-2" v-model="form.password" type="password" required :placeholder="$t('app.login.passwordplaceholder')"></b-form-input>
                        <b-link @click="handleForgotPassword">{{ $t('app.login.forgotpassword') }}</b-link>
                    </b-form-group>
                    <!-- Submit -->
                    <b-button type="submit" variant="primary" :disabled="submit">
                        <b-spinner small type="grow" v-if="submit"></b-spinner>
                        {{ $t('app.login.login') }}
                    </b-button>
                </b-form>
            </b-col>
        </b-row>
    </b-container>
</template>

<script>
const { shell } = require('electron')

export default {
    data () {
        return {
            form: {
                email: '',
                password: ''
            },
            submit: false
        }
    },
    methods: {
        handleCreateAccount () {
            shell.openExternal('https://wowclassicui.com/register')
        },
        handleForgotPassword () {
            shell.openExternal('https://wowclassicui.com/password/reset')
        },
        handleSubmit () {
            this.submit = true

            let email = this.form.email
            let password = this.form.password

            this.$store.dispatch('auth/login', { email, password })
                .then(() => {
                    this.$router.push('/addons')
                })
                .catch(() => {
                    this.submit = false
                })
        }
    }
}
</script>
