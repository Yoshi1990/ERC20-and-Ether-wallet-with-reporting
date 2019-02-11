<template>
    <modal @close="$emit('close')">
        <form style="width: 400px" @submit.prevent="onSubmit">
			<ui-error :data="errors.global"></ui-error>
            <ui-input
                type="text"
                title="Destination address"
                v-model="transfer.address"
                :error="errors.address"
                :required="true"
                placeholder="0x0000000000000000000000000000000000000000"
            ></ui-input>
            <ui-input
                type="number"
                title="Amount"
                v-model.number="transfer.amount"
                :error="errors.amount"
                :min="0"
                :step="0.000001"
                :required="true"
            ></ui-input>
            <ui-input
                type="radio-buttons"
                :options="currency.names"
                v-model="transfer.currency"
                :error="errors.currency"
            ></ui-input>
            <ui-input
                type="radio-buttons"
                :options="{
                    slow: 'Slow / Cheap',
                    normal: 'Standard',
                    fast: 'Fast / Costly'
                }"
                v-model="transfer.speed"
                :error="errors.speed"
            ></ui-input>
            <ui-input
				type="password"
				title="Your current account's password"
				v-model="transfer.password"
				:error="errors.password"
                :required="true"
			></ui-input>
			<ui-button
				type="submit"
				:confirm="confirm"
				:loading="loading"
				style="width: 100%">
                <template v-if="transfer.amount > 0">
                    send {{ transfer.amount  }} {{ currency.symbols[transfer.currency] }}
                </template>
                <template v-else>send</template>
            </ui-button>
        </form>
    </modal>
</template>

<script>
import * as validator from '@/validator'
import validatorSendMoney from '@/validator/user/send-money'
export default {
	data: () => ({
        loading: false,
        errors: false,
        confirm: false,
		transfer: {
            currency: 'erc20',
            address: '',
            amount: 0,
            password: '',
            speed: 'normal',
            gas_price: 0,
            gas_limit: 0,
        },
    }),
    computed: {
        currency() {
            let erc20 = this.$store.state.boot.config.erc20
            return {
                names: {
                    eth: 'Ethereum',
                    erc20: erc20.name,
                },
                symbols: {
                    eth: 'ETH',
                    erc20: erc20.symbol,
                },
            }
        },
    },
	methods: {
		onSubmit() {
            this.loading = true
            return validator.validate(this.transfer, validatorSendMoney)
				.then(data => this.$http.post('transfer/' + (this.confirm ? 'send' : 'estimate'), data))
				.then(res => {
                    this.loading = this.errors = false
                    if (this.confirm) {
                        this.confirm = false
                        this.$emit('close', 'success')
                    } else {
                        this.transfer.gas_price = res.data.gas_price
                        this.transfer.gas_limit = res.data.gas_limit
                        this.$nextTick(() => this.confirm = 'Confirm? (cost ' + res.data.eth + ' ETH)')
                    }
				})
				.catch(err => {
                    this.loading = false
                    this.errors = validator.format(err)
                })
		},
	},
	watch: {
		transfer: {
			deep: true,
			handler() {
				this.confirm = false
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