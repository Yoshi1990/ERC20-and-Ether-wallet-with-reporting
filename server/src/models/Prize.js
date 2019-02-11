const { Model } = require('objection')

module.exports = class Prize extends Model {
	static tableName = 'prizes'
}