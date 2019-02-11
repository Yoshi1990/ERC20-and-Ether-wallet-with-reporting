exports.up = function(knex, Promise) {
    return knex.schema.table('transfers', t => {
        t.dropUnique(['block_number', 'transaction_index', 'symbol'])
    }).table('transfers', t => {
        t.unique(['block_number', 'transaction_index', 'symbol', 'from', 'to'])
    })
}

exports.down = function(knex, Promise) {
    return knex.schema.table('transfers', t => {
        t.dropUnique(['block_number', 'transaction_index', 'symbol', 'from', 'to'])
    }).table('transfers', t => {
        t.unique(['block_number', 'transaction_index', 'symbol'])
    })
}