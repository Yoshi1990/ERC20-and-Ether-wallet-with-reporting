const config = require('@/configs/redis')
const redis = require('redis')

// Promisify all
const bluebird = require('bluebird')
bluebird.promisifyAll(redis)

module.exports = redis.createClient(config)