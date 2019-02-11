<template>
    <modal @close="$emit('close')">
		<form style="width: 400px" @submit.prevent="onSubmit">
			<ui-error :data="errors.global"></ui-error>
			<ui-input
				type="textarea"
				title="Your private key content, JSON keystore file, or even a mnemonic phrase"
				v-model="user.private_key"
				:error="errors.private_key"
			></ui-input>
			<ui-input
				type="password"
				title="JSON keystore file's password"
				v-if="user.private_key.substr(0, 1) == '{'"
				v-model="user.private_key_password"
				:error="errors.private_key_password"
			></ui-input>
			<ui-input
				type="password"
				title="Your current account's password"
				v-model="user.password"
				:error="errors.password"
			></ui-input>
			<ui-button
				type="submit"
				:confirm="confirmed"
				:loading="loading"
				style="width: 100%"
			>save</ui-button>
		</form>
    </modal>
</template>

<script>
import * as validator from '@/validator'
import validatorPrivateKey from '@/validator/user/private-key'
export default {
	data: () => ({
		confirmed: false,
		loading: false,
		errors: false,
		user: {
			private_key: '',
			private_key_password: '',
			password: '',
		},
	}),
	methods: {
		onSubmit() {
			// Ask to confirm
			if (!this.confirmed) {
				this.confirmed = true
				return
			}

			this.loading = true
			return validator.validate(this.user, validatorPrivateKey)
				.then(data => this.$http.post('user/private_key', data))
				.then(res => {
					this.confirmed = this.loading = this.errors = false
					this.$store.commit('auth/onLogin', res.data)
					this.$emit('close')
				})
				.catch(err => {
					this.confirmed = this.loading = false
					this.errors = validator.format(err)
				})
		},
	},
	watch: {
		user: {
			deep: true,
			handler() {
				this.confirmed = false
			},
		},
	},
	components: {
		modal: require('@/ui/modal').default,
		uiInput: require('@/ui/input').default,
		uiError: require('@/ui/error').default,
		uiButton: require('@/ui/button').default,
	},
}
</script>