const serve = require('webpack-serve')
const config = require('./webpack.config.js')
const httpProxy = require('http-proxy')
const launchEditor = require('launch-editor')
const path = require('path')

serve({
	config,
	port: 1337,
	hot: !process.argv.includes('no-hot-reload'),
	add(app, middleware) {
		// Open in editor
		app.use(async (ctx, next) => {
			if (/^\/__open-in-editor/.test(ctx.url)) {
				if (!ctx.query.file) {
					ctx.status = 500
					ctx.body = `launch-editor: required query param "file" is missing.`
				} else {
					launchEditor(path.resolve(__dirname, ctx.query.file), 'code')
					ctx.body = 'Ok'
				}
			} else {
				await next()
			}
		})

		// Fix HEAD
		app.use(async (ctx, next) => {
			if (ctx.method === 'HEAD') ctx.method = 'GET'
			await next()
		})

		// Webpack content first
		middleware.webpack()
		middleware.content()
		
		// Proxy
		app.use(async (ctx) => {
			await new Promise((resolve, reject) => {
				const proxy = httpProxy.createProxyServer()
				proxy.web(ctx.req, ctx.res, {
					target: 'http://localhost',
					xfwd: true,
				}, resolve)
				proxy.on('error', err => {
					console.log('Proxy: ' + err)
					reject(err)
				})
			})
		})
	},
})