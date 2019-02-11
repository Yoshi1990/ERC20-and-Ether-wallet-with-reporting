const ethers = require('ethers')
const axios = require('axios')
const UserModel = require('@/models/User')
const TransferModel = require('@/models/Transfer')
const TokenValueModel = require('@/models/TokenValue')
const Etherscan = require('./etherscan')
const config = require('@/configs/app')

const ERC20_ABI = [
	{
		constant: true,
		inputs: [{ name: '_owner', type: 'address' }],
		name: 'balanceOf',
		outputs: [{ name: 'balance', type: 'uint256' }],
		payable: false,
		type: 'function'
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				name: '_from',
				type: 'address'
			},
			{
				indexed: true,
				name: '_to',
				type: 'address'
			},
			{
				indexed: false,
				name: '_value',
				type: 'uint256'
			}
		],
		name: 'Transfer',
		type: 'event'
	},
	{
		constant: false,
		inputs: [
			{
				name: '_to',
				type: 'address',
			},
			{
				name: '_value',
				type: 'uint256',
			}
		],
		name: 'transfer',
		outputs: [
			{
				name: '',
				type: 'bool',
			}
		],
		payable: false,
		stateMutability: 'nonpayable',
		type: 'function',
	},
]

// Provider INFUA, backed by Etherscan
const infuraProvider = new ethers.providers.InfuraProvider(config.network, config.infura_apikey)
const etherscanProvider = new ethers.providers.EtherscanProvider(config.network, config.etherscan_apikey)
const provider = new ethers.providers.FallbackProvider([
	infuraProvider,
	etherscanProvider
])

// ERC20 contract
const contract = new ethers.Contract(config.erc20.contract, ERC20_ABI, provider)

// Reload one wallet
const reloadWallet = async (wallet) => {
	let data = {}
	console.log('reload wallet', wallet.public_key)

	// ETH balance
	try {
		let balance = await provider.getBalance(wallet.public_key)
		data.balance_eth = ethers.utils.formatEther(balance)
	} catch (err) {
		console.error(err)
	}

	// ERC20 balance
	try {
		let balance = await contract.balanceOf(wallet.public_key)
		data.balance_erc20 = ethers.utils.formatUnits(balance, config.erc20.decimals)
	} catch (err) {
		console.error(err)
	}

	// Save
	wallet.patch(data).catch(err => console.error('wallet save balance', err))
}

// Reload last eth transaction
const reloadETHTranfers = async (wallet) => {
	console.log('reload wallet eth transfers', wallet.public_key)

	// ETH balance
	try {
		let transfers = await Etherscan.ethTransfers(wallet.public_key)
		if (transfers.message === 'OK') {
			for (let data of transfers.result) {
				if (!data.from || !data.to) continue
				TransferModel.query().insertIgnore({
					from: data.from.toLowerCase(),
					to: data.to.toLowerCase(),
					amount: ethers.utils.formatEther(data.value),
					block_number: data.blockNumber,
					transaction_index: data.transactionIndex,
					symbol: 'ETH',
				}).catch(err => console.error('insert transfer', err))
			}
		}
	} catch (err) {
		console.error(err)
	}
}

// Reload transfers
const reloadERC20Transfers = async () => {
	console.log('reload erc20 transfers')
	try {
		let transfers = await Etherscan.erc20Transfers(config.erc20.contract)
		if (transfers.message === 'OK') {
			for (let data of transfers.result) {
				TransferModel.query().insertIgnore({
					from: data.from.toLowerCase(),
					to: data.to.toLowerCase(),
					amount: ethers.utils.formatUnits(data.value, config.erc20.decimals),
					block_number: data.blockNumber,
					transaction_index: data.transactionIndex,
					symbol: config.erc20.symbol,
				}).catch(err => console.error('insert transfer', err))
			}
		} else {
			console.error(transfers)
		}
	} catch (err) {
		console.error('erc20 transfers failed:', err)
	}
}

// Reload xx/usd rate
const reloadUsdRate = async () => {
	console.log('reload usd rates')
	let rates = {
		ETH: 1027,
		[config.erc20.symbol]: config.erc20.coinmarketcap_id,
	}

	for (let [symbol, id] of Object.entries(rates)) {
		if (!id) continue

		// Fetch api
		try {
			var res = await axios.get(`https://api.coinmarketcap.com/v2/ticker/${id}/`)
			res = res.data
		} catch (err) {
			console.log('coin market api rejected: ', err)
		}

		if (!(res && res.data && res.data.quotes && res.data.quotes.USD)) {
			continue
		}
		
		// Insert or update
		TokenValueModel.query().insertOrUpdate({
			symbol: symbol,
			updated_at: res.data.last_updated,
			price_usd: res.data.quotes.USD.price,
			change_1d: res.data.quotes.USD.percent_change_24h,
		}, ['updated_at', 'price_usd', 'change_1d'])
		.catch(err => console.error('insert token value', err))
	}
}

// Reload wallets
var last_refresh
const reload = async (restart = true) => {
	last_refresh = (new Date()).getTime()

	// Foreach pages
	let nb_pages = 1
	let page = 0
	while (page < nb_pages) {
		let data = await UserModel.query().orderBy('updated_at', 'desc').page(page, 500)
		nb_pages = Math.ceil(data.total / 500)
		page++

		// Foreach wallets
		for (let wallet of data.results) {
			await reloadWallet(wallet)
			await reloadETHTranfers(wallet)
		}
	}

	await reloadERC20Transfers()

	// If called by /refresh url
	if (!restart) {
		await reloadUsdRate()
	}

	// Reload on finish (every 1 hour max)
	if (restart) {
		let refresh_in = 60 * 60 * 1000 - ((new Date()).getTime() - last_refresh)
		if (refresh_in < 0) refresh_in = 0
		setTimeout(reload, refresh_in)
	}
}

// Detect transfers
contract.ontransfer = function (from, to, amount) {
	// Save transaction
	amount = ethers.utils.formatUnits(amount, config.erc20.decimals)
	console.log('transfer event', from, to, amount)

	this.getTransaction().then(data => {
		TransferModel.query().insertIgnore({
			from: from.toLowerCase(),
			to: to.toLowerCase(),
			amount,
			block_number: data.blockNumber,
			transaction_index: data.transactionIndex,
			symbol: config.erc20.symbol,
		}).catch(err => console.error('insert transfer', err))
	}).catch(err => console.error('etherscan transfers', err))

	// Relaod balances
	UserModel.query().whereIn('public_key', [from, to]).then(wallets => {
		for (let wallet of wallets) reloadWallet(wallet)
	})
}

// Exports
exports.ERC20_ABI = ERC20_ABI
exports.contract = contract
exports.provider = provider
exports.reload = reload
exports.reloadWallet = reloadWallet
exports.reloadERC20Transfers = reloadERC20Transfers
exports.reloadETHTranfers = reloadETHTranfers
exports.reloadUsdRate = reloadUsdRate

// At boot
//reload()
//reloadUsdRate()
//setInterval(reloadUsdRate, 1 * 60 * 60 * 1000)