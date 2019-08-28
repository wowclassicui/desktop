<template>
    <div>

        <b-container>
        <b-row class="justify-content-md-center">
            <b-col cols="6" md="auto">

                <b-form @submit.prevent="onSubmit">
                    <b-form-group id="input-group-1" label="Email address:" label-for="input-1"
                        description="We'll never share your email with anyone else.">
                        <b-form-input id="input-1" v-model="form.email" type="email" required placeholder="Enter email">
                        </b-form-input>
                    </b-form-group>

                    <b-form-group id="input-group-2" label="Your password:" label-for="input-2">
                        <b-form-input id="input-2" v-model="form.password" type="password" required placeholder="Enter password"></b-form-input>
                    </b-form-group>

                    <b-button type="submit" variant="primary" :disabled="submit">
                        <b-spinner small type="grow" v-if="submit"></b-spinner>
                        Login
                    </b-button>
                </b-form>

            </b-col>
        </b-row>
        </b-container>


    </div>
</template>

<script>
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
        onSubmit () {
            this.submit = true

            let email = this.form.email
            let password = this.form.password

            this.$store.dispatch('auth/login', { email, password })
                .then(() => {
                    this.$router.push('/addons')
                    // this
                })
                .catch(() => {
                    // console.log(err)
                    this.submit = false
                })
        }
    }
}
</script>

<style scoped>

</style>
