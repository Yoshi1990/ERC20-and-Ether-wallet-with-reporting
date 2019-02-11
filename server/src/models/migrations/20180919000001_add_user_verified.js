exports.up = function(knex, Promise) {
    return knex.schema.table('users', t => {
        t.boolean('verified').notNull()
    })
}

exports.down = function(knex, Promise) {
    return knex.schema.table('users', t => {
        t.dropColumn('verified')
    })
}