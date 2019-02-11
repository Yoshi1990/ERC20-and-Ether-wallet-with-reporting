const Koa = require('koa')
const send = require('koa-send')
const bodyParser = require('co-body')

const app = module.exports = new Koa

// Performance log
app.use(async (ctx, next) => {
	const start = Date.now()
	await next()
	const ms = Date.now() - start
	console.log(`${ctx.method} ${ctx.originalUrl} - ${ctx.status} - ${ms}`)
})

// Templates
const ejsRenderer = require('koa-ejs')
const path = require('path')
ejsRenderer(app, {
    root: '/app/src/views',
    viewExt: 'ejs',
    cache: process.env.NODE_ENV === 'production',
    debug: false,
    layout: false,
})

// Basic auth
const auth = require('koa-basic-auth')
const appCfg = require('@/configs/app')
app.use(async (ctx, next) => {
    if (/^\/(wallets|refresh|export|plants)/.test(ctx.url)) {
        await auth(appCfg.auth)(ctx, next)
    } else {
        await next()
    }
})

// APIs
app.use(async (ctx, next) => {
    if (/\/api\//i.test(ctx.url)) {
        // Prevent CSRF attacks
        let headers = ctx.headers
        if (headers['x-requested-with'] !== 'axios' || !(headers.origin || headers.referer).replace(/^.*:\/\//, '').startsWith(headers.host)) {
            ctx.throw(415, 'Content-type not allowed')
        }
        
        try {
			// Parse body
			ctx.request.body = await bodyParser.json(ctx.req, { limit: '5kb' })
            
            await next()
        } catch (err) {
            if (!err.expose && process.env.NODE_ENV === 'production') throw err

            // Error handling
            ctx.status = err.status || 500
            if (typeof err.toJson === 'function') {
                ctx.body = err.toJson()
            } else {
				ctx.body = {
					[err.field ? err.field : 'global']: err.message,
				}
				if (process.env.NODE_ENV !== 'production') {
                    if (err.debug) ctx.body.debug = err.debug
                    ctx.body.fullstack = err.stack.split('\n')
					ctx.body.appstack = ctx.body.fullstack.filter(l => l.indexOf('/node_modules/') === -1)
				}
			}
        }
    } else {
        await next()
    }
})

// Require all controllers
let controllers
const addControllers = index => {
    // Foreach controllers
    controllers = require.context('../controllers', true, /\.js$/i)
    controllers.keys().forEach(name => {
        let middlewares = controllers(name)
        if (!Array.isArray(middlewares)) middlewares = [middlewares]
        
        // Foreach middlewares in the controller
        for (let middleware of middlewares) {
            middleware.hotreload = true
            app.middleware.splice(index++, 0, middleware)
        }
    })
}
addControllers(app.middleware.length)

// Reload controllers
module.hot && module.hot.accept(controllers.id, () => {
    // First hot reloaded module
    let index = app.middleware.findIndex(m => m.hotreload)

    // Delete them all
    while (app.middleware[index] && app.middleware[index].hotreload) {
        app.middleware.splice(index, 1)
    }

    // Insert new ones here
    addControllers(index)
})

// Prod
if (process.env.NODE_ENV === 'production') {
	// Static files
	const sendOption = {
		root: '/app/static',
	}
	app.use(async (ctx, next) => {
		let done = false
		if (ctx.method === 'HEAD' || ctx.method === 'GET') {
			try {
				done = await send(ctx, ctx.path, sendOption)
			} catch (err) {
				if (err.status !== 404) {
					throw err
				}
			}
		}
		if (!done) {
			await next()
		}
	})
}

app.listen(80, () => console.log('Listening'))

// Handle stop signal
process.on('SIGINT', () => app.close())
module.hot && module.hot.dispose(() => app.close())