const { Model, QueryBuilder } = require('objection')
const knex = require('@/app/knex')

// Bind knex instance
Model.knex(require('@/app/knex'))

/**
 * Paginate results
 */
QueryBuilder.prototype.paginate = function (ctx, nb_per_page) {
	let current = ctx.request.query.page * 1 || 1
	return this.page(current - 1, nb_per_page).then(res => {
		res.current = current
		res.per_page = nb_per_page
		return res
	})
}

/**
 * Insert ignore for mysql
 */
QueryBuilder.prototype.insertIgnore = function (data) {
	let query = knex(this.modelClass().tableName).insert(data).toString()
	query = query.replace(/^insert/i, 'insert ignore')
	return knex.raw(query)
}

/**
 * Insert .. ON DUPLICATE KEY UPDATE for mysql
 */
QueryBuilder.prototype.insertOrUpdate = function (data, updatedFields) {
	let query = knex(this.modelClass().tableName).insert(data).toString()
	query += ' ON DUPLICATE KEY UPDATE '
	updatedFields.forEach((field, i) => {
		if (i) query += ', '
		query += `${field}=VALUES(${field})`
	})
	return knex.raw(query)
}

/**
 * Only patch updated data, and set those values on the model
 */
Model.prototype.patch = function (data) {
	const id_field = this.constructor.idColumn

	// Update this model + get dirty values
	const patch = {}
	for (let key in data) {
		if (key === id_field) continue
		let value = data[key]
		if (value !== this[key]) {
			this[key] = patch[key] = value
		}
	}

	// No changes
	if (Object.keys(patch).length === 0) {
		return Promise.resolve(0)
	}

	// Update dirty values
	return this.constructor.query().where(id_field, this[id_field]).patch(patch)
}