exports.up = function (knex, Promise) {
    return knex.schema.table('users', t => {
        t.integer('nb_login').defaultTo(0)
    })
}

exports.down = function (knex, Promise) {
    return knex.schema.table('users', t => {
        t.dropColumn('nb_login')
    })
}