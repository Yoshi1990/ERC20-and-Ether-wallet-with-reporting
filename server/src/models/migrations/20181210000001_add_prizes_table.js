exports.up = function (knex) {
	return knex.schema.createTable('prizes', t => {
		t.increments('id').unsigned().primary()
		t.integer('user_id').unsigned().notNull()
        t.foreign('user_id').references('users.id').onDelete('CASCADE')
        t.timestamp('created_at').defaultTo(knex.fn.now())
        t.boolean('given')
	})
}

exports.down = function (knex) {
	return knex.schema.dropTable('prizes')
}