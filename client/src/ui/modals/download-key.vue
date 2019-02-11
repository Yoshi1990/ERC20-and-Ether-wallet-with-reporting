<template>
    <modal @close="$emit('close')">
		<form style="width: 400px" @submit.prevent="onSubmit">
			<ui-error :data="errors.global"></ui-error>
             <ui-input
                type="radio-buttons"
                :options="{
                    raw: 'Raw private key',
                    json: 'JSON keystore file',
                }"
                v-model="pk.format"
                :error="errors.format"
            ></ui-input>
            <ui-input
				type="password"
				title="JSON keystore file's password"
				v-if="pk.format === 'json'"
				v-model="pk.private_key_password"
				:error="errors.private_key_password"
			></ui-input>
			<ui-input
				type="password"
				title="Your current account's password"
				v-model="pk.password"
				:error="errors.password"
			></ui-input>
			<ui-button
				type="a"
                :confirm="download ? 'download' : false"
                :href="download ? download.content : false"
                :download="download ? download.name : false"
                confirm-color="success"
                @click="download ? $emit('close') : onSubmit()"
				:loading="loading"
				style="width: 100%"
			>fetch it</ui-button>
		</form>
    </modal>
</template>

<script>
import * as validator from '@/validator'
import validatorPrivateKey from '@/validator/user/download-key'
import ethers from 'ethers'

export default {
	data: () => ({
        download: false,
		loading: false,
		errors: false,
		pk: {
			format: 'json',
			private_key_password: '',
			password: '',
		},
	}),
	methods: {
		onSubmit() {
            this.loading = true
            let is_json = this.pk.format === 'json'
            let pwd = this.pk.private_key_password
			return validator.validate(this.pk, validatorPrivateKey)
				.then(data => this.$http.post('user/dl_key', data))
				.then(res => {
                    if (is_json) {
                        let wallet = new ethers.Wallet(res.data.private_key)
                        return wallet.encrypt(pwd).then(json => {
                            return {
                                name: 'keystore-file.json',
                                content: json,
                            }
                        })
                    } else {
                        return {
                            name: 'private-key.txt',
                            content: res.data.private_key,
                        }
                    }
                })
                .then(res => {
					this.loading = this.errors = false
                    res.content = 'data:text/plain;charset=utf-8,' + encodeURIComponent(res.content)
                    this.download = res
                })
				.catch(err => {
					this.loading = false
					this.errors = validator.format(err)
				})
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