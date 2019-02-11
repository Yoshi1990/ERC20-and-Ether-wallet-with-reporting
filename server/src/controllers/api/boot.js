const route = require('koa-route')
const auth = require('@/app/auth')
const config = require('@/configs/app')

module.exports = [
    /** Data for app startup */
    route.get('/api/boot/app', async (ctx) => {
        const user = await auth.user(ctx)
        ctx.body = {
            user: user ? user.toJsonAuth() : null,
            config: {
                erc20: {
                    name: config.erc20.name,
                    symbol: config.erc20.symbol,
                },
                title: config.title,
                private_policy_url: config.private_policy_url,
            },
        }
    }),
]