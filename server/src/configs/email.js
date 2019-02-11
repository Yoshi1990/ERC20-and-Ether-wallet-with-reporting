const appCfg = require('@/configs/app')

module.exports = {
	// https://nodemailer.com/message/
	message: {
		from: appCfg.email.sender_name + ' <' + appCfg.email.sender_email + '>',
	},
	// https://nodemailer.com/transports/
	transport: process.env.NODE_ENV === 'production' ? appCfg.email.transport : {
		host: 'smtp.mailtrap.io',
		port: 2525,
		auth: {
			user: '',
			pass: ''
		},
	},
	subject_prefix: process.env.NODE_ENV === 'development' ? '[DEBUG] ' : '',
}
