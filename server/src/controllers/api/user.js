const route = require('koa-route')
const auth = require('@/app/auth')
const knex = require('@/app/knex')
const User = require('@/models/User')
const Prize = require('@/models/Prize')

const { validate } = require('@client/validator')
const validatorPrivateKey = require('@client/validator/user/private-key').default
const validatorDownloadKey = require('@client/validator/user/download-key').default

module.exports = [
    /** Upload a new private key */
    route.post('/api/user/private_key', async (ctx) => {
        const user = await auth.required(ctx)

        // Validated body
		let data = await validate(ctx.request.body, validatorPrivateKey)
        
        // Check password
        let valid = await user.verifyPassword(data.password)
        if (!valid) ctx.throw(400, 'Wrong password', { field: 'password' })

        // Set private + public key
        await user.patch({
            private_key: User.encryptPrivate(data.private_key, data.password),
            public_key: data.public_key,
            balance_eth: 0,
            balance_erc20: 0,
        })
        ctx.body = user.toJsonAuth()
    }),

    /** Download the private key */
    route.post('/api/user/dl_key', async (ctx) => {
        const user = await auth.required(ctx)

        // Validated body
		let data = await validate(ctx.request.body, validatorDownloadKey)
        
        // Check password
        let valid = await user.verifyPassword(data.password)
        if (!valid) ctx.throw(400, 'Wrong password', { field: 'password' })

        ctx.body = {
            private_key: User.decryptPrivate(user.private_key, data.password),
        }
    }),

    /** Claim it's tocket */
    route.post('/api/user/claim', async (ctx) => {
        const user = await auth.required(ctx)

        if (user.nb_login >= 6) {
            await knex.transaction(async trx => {
                // Reset nb_login
                await User.query(trx)
                    .patch({ nb_login: 0 })
                    .where('nb_login', '>=', 6)
                    .where('id', user.id)
                
                // Add entry to prizes
                await Prize.query(trx).insert({
                    user_id: user.id,
                    given: false,
                })
            })
        }

        ctx.body = {
            success: true,
        }
    }),
]