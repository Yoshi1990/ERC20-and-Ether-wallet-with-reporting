/* global SERVER */
import ethers from 'ethers'
export default {
	password: {
		required: true,
	},
	private_key: {
		name: 'private key',
		required: true,
		custom(value, { data, results }) {
			let wallet

			value = (value + '').trim()
			if (value.substr(0, 1) === '{') {
				return new ethers.Wallet.fromEncryptedWallet(value, data.private_key_password).then(wallet => {
					if (SERVER) results.public_key = wallet.address
					return wallet.privateKey
				})
			} else if (value.indexOf(' ') > 0) {
				wallet = new ethers.Wallet.fromMnemonic(value)
			} else {
				if (value.substr(0, 2) !== '0x') value = '0x' + value
				wallet = new ethers.Wallet(value)
			}

			if (SERVER) results.public_key = wallet.address
			return wallet.privateKey
		},
	},
}