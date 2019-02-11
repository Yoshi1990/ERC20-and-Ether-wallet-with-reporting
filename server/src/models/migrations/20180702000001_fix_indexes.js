exports.up = function(knex, Promise) {
    return knex.schema.raw('DELETE FROM transfers WHERE block_number IS NULL OR transaction_index IS NULL')
        .raw('DELETE t1 FROM transfers t1 INNER JOIN transfers t2 WHERE t1.id > t2.id AND t1.block_number = t2.transaction_index AND t1.block_number = t2.transaction_index')
        .table('wallets', t => {
            t.index('public_key')
        })
        .table('transfers', t => {
            t.index('from')
            t.index('to')
            t.decimal('amount', 50, 18).notNullable().alter()
            t.integer('block_number').unsigned().notNullable().alter()
            t.integer('transaction_index').unsigned().notNullable().alter()
            t.unique(['block_number', 'transaction_index'])
        })
}

exports.down = function(knex, Promise) {
    return knex.schema.table('wallets', t => {
        t.dropIndex('public_key')
    })
    .table('transfers', t => {
        t.dropIndex('from')
        t.dropIndex('to')
        t.decimal('amount', 50, 18).nullable().alter()
        t.integer('block_number').nullable().alter()
        t.integer('transaction_index').nullable().alter()
        t.dropUnique(['block_number', 'transaction_index'])
    })
}