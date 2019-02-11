const route = require('koa-route')
const auth = require('@/app/auth')
const User = require('@/models/User')
const signupEmail = require('@/views/emails/auth/signup')

const { validate } = require('@client/validator')
const validatorSignup = require('@client/validator/auth/signup').default
const validatorLogin = require('@client/validator/auth/login').default

module.exports = [
    // Signup
    route.post('/api/auth/signup', async (ctx) => {
        // Validated body
        let data = ctx.request.body
        data.ip = ctx.request.ip
        data = await validate(data, validatorSignup)

        // Lowercase public key
        data.public_key = data.public_key.toLowerCase()

        // Ip
        data.ip = ctx.ip

        // Insert
        delete data.captcha_token
        data.verified = false
        data.private_key = User.encryptPrivate(data.private_key, data.password)
        data.password = await User.hashPassword(data.password)
        data.nb_login = 1
        const user = await User.query().insert(data)
        
        // Send email
        try {
            await signupEmail(user, ctx.request.origin)
        } catch (err) {
            await User.query().deleteById(user.id)
            throw err
        }
        
        ctx.body = { success: true }
    }),

    // Login
    route.post('/api/auth/login', async (ctx) => {
		// Validated body
		let data = await validate(ctx.request.body, validatorLogin)
		
		// Select user
		const user = await User.query()
			.where('username', data.username)
			.first()
		if (user) {
            let valid
            try {
                valid = await user.verifyPassword(data.password)
            } catch (err) {
                ctx.throw(400, 'Invalid username or password')
            }
            if (valid) {
                if (!user.verified) {
                    ctx.throw(400, 'Your account is not yet verified. Please check your emails.')
                }

                await auth.login(ctx, user.id, data.remember_me)
                ctx.body = user.toJsonAuth()
                return
            }
        }
        
        ctx.throw(400, 'Invalid username or password')
    }),

    // Logout
    route.post('/api/auth/logout', async (ctx) => {
        await auth.logout(ctx)
        ctx.body = {}
    }),

    //TODO: lost password
    //TODO: reset password
    
    // List sessions
    route.get('/api/auth/sessions', async (ctx) => {
        const user = await auth.required(ctx)
        ctx.body = await auth.listSession(user.id)
    }),

    // Signup confirmation
    route.get('/auth/verify/:hash', async (ctx, hash) => {
        let user = await User.getUserByHash(hash)
        if (user) {
            await user.patch({ verified: true })
            await auth.login(ctx, user.id, false)
            return ctx.redirect('/')
        }
        user = await auth.user(ctx)
        if (user) {
            return ctx.redirect('/')
        }
        ctx.redirect('/?failedverify')
    }),
]