const nodemailer = require('nodemailer')
const config = require('@/configs/email')
const transporter = module.exports = nodemailer.createTransport(config.transport, config.message)

/**
 * Async version of transporter.sendMail with some added features
 * @param	{Object}	data		See https://nodemailer.com/message/
 */
transporter.send = function (data) {
	data.subject = config.subject_prefix + data.subject

	return new Promise((resolve, reject) => {
		transporter.sendMail(data, (err, info) => {
			if (err) reject(err)
			else resolve(info)
		})
	})
}