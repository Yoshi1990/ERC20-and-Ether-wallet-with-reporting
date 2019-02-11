exports.up = function(knex, Promise) {
    return knex.schema.table('transfers', t => {
        t.string('symbol', 3)
    }).raw('UPDATE transfers SET symbol = \'TTU\'')
}

exports.down = function(knex, Promise) {
    return knex.schema.table('transfers', t => {
        t.dropColumn('symbol')
    })
}