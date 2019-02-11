<template>
    <form @submit.prevent="$store.dispatch('auth/login', user)" class="auth-login">
        <h1>Login</h1>
        <ui-error :data="errors.global"></ui-error>
        <ui-input   
            type="email"
            v-model="user.username"
            :error="errors.username"
            title="Email address"
            placeholder="Your current email address"
            maxlength="255"
            required></ui-input>
        <ui-input   
            type="password"
            v-model="user.password"
            :error="errors.password"
            title="Password"
            maxlength="50"
            required></ui-input>
        <ui-input type="checkbox"
            v-model="user.remember_me"
            placeholder="Remember me"
        ></ui-input>
        <ui-button type="submit" :loading="$store.state.auth.loadings.login" style="width: 100%">Login</ui-button>
    </form>
</template>

<script>
export default {
	data: () => ({
		user: {
			username: '',
            password: '',
            remember_me: true,
        },
    }),
    computed: {
        errors() {
            return this.$store.state.auth.errors.login || {}
        },
    },
    components: {
        uiError: require('@/ui/error').default,
        uiInput: require('@/ui/input').default,
        uiButton: require('@/ui/button').default,
    },
}
</script>

<style lang="scss">
.auth-login {
	width: 304px;
}
</style>