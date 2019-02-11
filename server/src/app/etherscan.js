const axios = require('axios').create()
const config = require('@/configs/app')

// 5 requests max per sec
let last_invocation_time = null
const scheduler = (config) => {
	const now = Date.now()
	if (last_invocation_time) {
		last_invocation_time += 210
		const wait_period_for_this_request = last_invocation_time - now
		if (wait_period_for_this_request > 0) {
			return new Promise((resolve) => {
				setTimeout(() => resolve(config), wait_period_for_this_request)
			})
		}
	}
	last_invocation_time = now
	return config
}
axios.interceptors.request.use(scheduler)

// List wallet's transfers
exports.erc20Transfers = contractaddress => {
	return axios.get('http://api.etherscan.io/api', { params: {
		module: 'account',
		action: 'tokentx',
		contractaddress,
		startblock: 0,
		endblock: 9999999999,
		sort: 'desc',
		apikey: config.etherscan_apikey,
	}}).then(res => res.data)
}

exports.ethTransfers = address => {
	return axios.get('http://api.etherscan.io/api', { params: {
		module: 'account',
		action: 'txlist',
		address,
		startblock: 0,
		endblock: 9999999999,
		offset: 5,
		sort: 'desc',
		apikey: config.etherscan_apikey,
	}}).then(res => res.data)
}