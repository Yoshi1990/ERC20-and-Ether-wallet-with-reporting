const email = require('@/app/email')
const cfg = require('@/configs/email')
const route = require('koa-route')

// verify connection configuration
module.exports = [
	// Test email settings
    route.get('/test/emails', async (ctx) => {
		return new Promise((resolve, reject) => {
			email.verify(err => {
				if (err) {
					ctx.body = err + ''
				} else {
					email.send({
						to: cfg.message.from,
						subject: 'Test email',
						text: 'Test email',
						html: '<h1>Test email</h1>',
					}).then(
						() => {
							ctx.body = 'Server is ready to send our messages. Test email sent.'
							resolve()
						},
						err => {
							ctx.body = 'Server is ready to send our messages. But failed to send test email: ' + err
							resolve()
						}
					)
				}
			})
		})
	}),
]