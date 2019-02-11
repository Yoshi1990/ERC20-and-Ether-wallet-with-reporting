exports.up = function(knex, Promise) {
    return knex.schema.createTable('wallets', t => {
        t.increments('id').unsigned().primary()
        t.timestamps()
        t.string('public_key').notNull()
    })
}

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('wallets')
}
