<template>
	<form @submit.prevent="signup" class="auth-signup">
		<h1>Signup</h1>
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
            title="Create your private key password"
			maxlength="50"
			placeholder="Select a password"
			require></ui-input>
		<ui-recaptcha sitekey="6Lcd7l8UAAAAAOc9evaGQgRnTTUKbfvUozkoBYmj"></ui-recaptcha>
		<ui-input type="checkbox"
			:placeholder="`I consent to receive quarterly update emails and security alerts${title}${private_policy}.`"
			required
		></ui-input>
		<ui-button type="submit" :loading="$store.state.auth.loadings.signup" style="width: 100%">Create my wallet</ui-button>

		<modal-signup-success v-if="signup_success_open" @close="signup_success_open = false"></modal-signup-success>
	</form>
</template>

<script>
import ethers from 'ethers'
export default {
	data: () => ({
		signup_success_open: false,
		user: {
			password: '',
			username: '',
			public_key: '',
			private_key: '',
		},
	}),
	computed: {
        errors() {
            return this.$store.state.auth.errors.signup || {}
		},
		title() {
			let title = this.$store.state.boot.config.title
			if (title) title = ' from ' + title + ' and their partners'
			return title || ''
		},
		private_policy() {
			let private_policy_url = this.$store.state.boot.config.private_policy_url
			if (private_policy_url) return ' and I agree to the <a href="' + private_policy_url + '" target="_blank">privacy policy</a>'
			return ''
		},
    },
	methods: {
		signup() {
			let wallet = ethers.Wallet.createRandom()

			window.gtag && window.gtag('event', 'click', {
				'event_category': 'generateTokenButton',
				'event_label': 'Token Button Pressed'
			})

			this.user.public_key = wallet.address
			this.user.private_key = wallet.privateKey

			this.$store.dispatch('auth/signup', this.user).then(res => {
				if (res === true) {
					this.signup_success_open = true

					// Cleanup form
					for (let k in this.user) {
						this.user[k] = ''
					}
				} else {
					window.gtag && window.gtag('event', 'error', {
						event_category: 'generateTokenButton',
						event_label: res,
					})
				}
				window.grecaptcha.reset()
			})
		}
	},
	components: {
        uiError: require('@/ui/error').default,
		uiInput: require('@/ui/input').default,
		uiRecaptcha: require('@/ui/recaptcha').default,
		uiButton: require('@/ui/button').default,
		modalSignupSuccess: require('@/ui/modals/signup-success').default,
    },
}
</script>

<style lang="scss">
.auth-signup {
	width: 304px;
}
</style>