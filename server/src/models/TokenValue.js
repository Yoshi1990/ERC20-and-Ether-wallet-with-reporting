const { Model } = require('objection')

module.exports = class TokenValue extends Model {
	static tableName = 'token_values'
}