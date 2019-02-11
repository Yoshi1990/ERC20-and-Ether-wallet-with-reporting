const config = require('@/configs/database')
const Knex = require('knex')
module.exports = Knex(config)