exports.up = function(knex, Promise) {
    return knex.schema.table('transfers', t => {
        t.integer('block_number')
        t.integer('transaction_index')
    })
}

exports.down = function(knex, Promise) {
    return knex.schema.table('transfers', t => {
        t.dropColumn('block_number')
        t.dropColumn('transaction_index')
    })
}