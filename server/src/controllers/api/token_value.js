const route = require('koa-route')
const auth = require('@/app/auth')
const TokenValue = require('@/models/TokenValue')

module.exports = [
    /** Data for app startup */
    route.get('/api/token_values', async (ctx) => {
        const user = await auth.required(ctx)
        ctx.body = await TokenValue.query()
    }),
]