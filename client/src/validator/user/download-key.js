export default {
	format: {
		required: true,
		enum: ['raw', 'json'],
	},
	password: {
		required: true,
	},
	private_key_password: {
		custom(value, { data }) {
			if (data.format === 'json' && (value === '' || value === null || value === undefined)) {
				throw new Error('Json keystore password required')
			}
			return value
		},
	},
}