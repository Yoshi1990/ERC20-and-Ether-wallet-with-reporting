export default {
	currency: {
		required: true,
		enum: ['eth', 'erc20'],
	},
	address: {
		required: true,
		pattern: /^0x[a-z0-9]{40}$/i,
	},
	amount: {
		required: true,
		type: 'number',
		min: 0,
	},
	password: {
		required: true,
	},
	speed: {
		name: 'gas price',
		required: true,
		enum: ['fast', 'normal', 'slow'],
	},
	gas_price: {
		name: 'Gas price',
	},
	gas_limit: {
		name: 'Gas limit',
	},
}