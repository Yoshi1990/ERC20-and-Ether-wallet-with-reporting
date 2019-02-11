exports.up = function(knex) {
    return knex.schema.createTable('users', t => {
        t.increments('id').unsigned().primary()
        t.timestamps()
        t.string('username').notNull()
        t.binary('password', 60).notNull()
        t.string('public_key').notNull()
        t.string('private_key').notNull()
        t.decimal('balance_eth', 50, 18).notNull().defaultTo(0)
        t.decimal('balance_erc20', 50, 18).notNull().defaultTo(0)
        t.index('public_key')
        t.unique('username')
    })
}

exports.down = function(knex) {
    return knex.schema.dropTable('users')
}
