exports.up = function(knex, Promise) {
    return knex.schema.createTable('token_values', t => {
        t.string('symbol').notNull().primary()
        t.integer('updated_at').unsigned().notNull()
        t.decimal('price_usd', 6+6, 6).notNull()
        t.decimal('change_1d', 3+4, 4)
    })
}

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('token_values')
}
