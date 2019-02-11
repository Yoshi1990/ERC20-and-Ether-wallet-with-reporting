const route = require('koa-route')
const auth = require('@/app/auth')
const Transfer = require('@/models/Transfer')
const ethers = require('ethers')
const { provider, ERC20_ABI } = require('@/app/ether')
const config = require('@/configs/app')

const { validate } = require('@client/validator')
const validatorSendMoney = require('@client/validator/user/send-money').default

module.exports = [
	/** Last last transactions */
	route.get('/api/transfers', async (ctx) => {
		const user = await auth.required(ctx)
		const public_key = user.public_key
		const transfers = await Transfer.query()
			.where(sql => sql.where('from', public_key).orWhere('to', public_key))
			.paginate(ctx, 100)
		ctx.body = transfers
	}),

	/** Estimate price */
	route.post('/api/transfer/estimate', async (ctx) => {
		const user = await auth.required(ctx)
		if (!user.private_key) {
			ctx.throw(400, 'You need to setup a private key inside your account to be able to send transfers')
		}

		// Validated body
		const data = await validate(ctx.request.body, validatorSendMoney)

		// Wallet
		const wallet = new ethers.Wallet(user.private_key)
		wallet.provider = provider

		// Gas limit/price
		let results
		if (data.currency === 'eth') {
			results = await Promise.all([
				wallet.provider.getGasPrice(),
				wallet.estimateGas({
					to: data.address,
					value: ethers.utils.parseEther(data.amount.toString()),
				})
			])
		} else {
			const contract = new ethers.Contract(config.erc20.contract, ERC20_ABI, wallet)
			results = await Promise.all([
				wallet.provider.getGasPrice(),
				contract.estimate.transfer(data.address, ethers.utils.parseEther(data.amount.toString()))
			])
		}
		const normal_gas_price = results[0]
		const estimated_gas = results[1]

		// Difference for fast/slow gas price
		const gas_prices = {
			slow: normal_gas_price.mul(ethers.utils.bigNumberify(80)).div(ethers.utils.bigNumberify(100)), // -20%
			normal: normal_gas_price,
			fast: normal_gas_price.mul(ethers.utils.bigNumberify(120)).div(ethers.utils.bigNumberify(100)), // +20%
		}
		const gas_price = gas_prices[data.speed]

		return ctx.body = {
			eth: ethers.utils.formatEther(gas_price.mul(estimated_gas)),
			gas_price: gas_prices[data.speed].toString(),
			gas_limit: estimated_gas.toString(),
		}
	}),

	/** Create a transfer */
	route.post('/api/transfer/send', async (ctx) => {
		const user = await auth.required(ctx)
		if (!user.private_key) {
			ctx.throw(400, 'You need to setup a private key inside your account to be able to send transfers')
		}
		
		// Validated body
		const data = await validate(ctx.request.body, validatorSendMoney)

		// Wallet
		const wallet = new ethers.Wallet(user.private_key)
		wallet.provider = provider	
		
		// Check password
		let valid = await user.verifyPassword(data.password)
		if (!valid) ctx.throw(400, 'Wrong password', { field: 'password' })

		// Send the transaction
		let amount = ethers.utils.parseEther(data.amount.toString())
		let options = {
			gasLimit: ethers.utils.bigNumberify(data.gas_limit),
			gasPrice: ethers.utils.bigNumberify(data.gas_price),
		}

		if (data.currency === 'eth') {
			const transaction = await wallet.send(data.address, amount, options)
			ctx.body = { transaction }
		} else {
			const contract = new ethers.Contract(config.erc20.contract, ERC20_ABI, wallet)
			success = await contract.functions.transfer(data.address, amount, options)
			if (!success) ctx.throw('The transfer failed for an unknown reason :s')
			ctx.body = { success: true }
		}
	}),
]