exports.up = function(knex, Promise) {
    return knex.schema.createTable('transfers', t => {
        t.increments('id').unsigned().primary()
        t.timestamp('created_at').defaultTo(knex.fn.now())
        t.string('from').notNull()
        t.string('to').notNull()
        t.decimal('amount', 50, 18)
    })
}

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('transfers')
}
