exports.up = function(knex, Promise) {
    return knex.schema.table('wallets', t => {
        t.string('ip', 39)
        t.string('email')
    })
}

exports.down = function(knex, Promise) {
    return knex.schema.table('wallets', t => {
        t.dropColumn('ip')
        t.dropColumn('email')
    })
}