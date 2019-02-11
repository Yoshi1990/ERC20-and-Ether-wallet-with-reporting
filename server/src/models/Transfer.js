const { Model } = require('objection')
const config = require('@/configs/app')

module.exports = class Transfer extends Model {
	static tableName = 'transfers'

	static namedFilters = {
		ETH: builder => builder.where('symbol', 'ETH')
			.orderBy('block_number', 'desc')
			.orderBy('transaction_index', 'desc'),
		ERC20: builder => builder.where('symbol', config.erc20.symbol)
			.orderBy('block_number', 'desc')
			.orderBy('transaction_index', 'desc'),
	}
}