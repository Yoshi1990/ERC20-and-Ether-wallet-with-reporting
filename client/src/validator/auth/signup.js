/* global SERVER */

export default {
	username: {
		required: true,
		name: 'email address',
		email: true,
		//TODO: server: not already in use
	},
	password: {
		required: true,
		min: 8,
		max: 50,
		custom(value) {
			if (!/[^a-zA-Z0-9]/.test(value) || !/[A-Z]/.test(value) || !/[a-z]/.test(value)) {
				throw new Error('At least one special character, one uppercase letter, and one lowercase letter')
			}
			return value
		},
	},
	captcha_token: {
		alias: 'global',
		name: 'recaptcha',
		required: SERVER,
		custom(captcha_token, extra) {
			if (SERVER) {
				// Check captcha
				return require('axios')({
					method: 'post',
					url: 'https://www.google.com/recaptcha/api/siteverify',
					params: {
						secret: '6Lcd7l8UAAAAAMeuR7Prt-DBotOyo_M6faSlzJ04',
						response: captcha_token,
						remoteip: extra.data.ip,
					},
				}).then(res => {
					if (res.data && res.data.success) return true
					throw new Error('Please check the captcha')
				})
			}

			// Check captcha
			let res = window.grecaptcha.getResponse()
			if (!res) throw new Error('Please check the captcha')
			return res
		},
	},
	public_key: {
		name: 'wallet public address',
		alias: 'global',
		required: true,
		pattern: /^0x[a-z0-9]{40}$/i,
	},
	private_key: {
		name: 'wallet private key',
		alias: 'global',
		required: true,
	},
}