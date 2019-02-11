exports.up = function(knex, Promise) {
    return knex.schema.table('users', t => {
        t.string('ip', 39)
    }).raw(`
        INSERT INTO users
        (id, created_at, updated_at, username, password, public_key, private_key, balance_eth, balance_erc20, ip)
        SELECT null, created_at, updated_at, IFNULL(email, CONCAT('wallet', id, '@makeitwein.com')), '', public_key, '', balance, balance_erc20, IFNULL(ip, '')
        FROM wallets
    `)
}

exports.down = function(knex, Promise) {
    return knex.schema.table('users', t => {
        t.dropColumn('ip')
    })
}