const mail = require('@/app/email')
const html = require('./html')
const text = require('./text')
const config = require('@/configs/app')

/**
 * @param {User} user
 */
module.exports = (user) => {
    const data = {
        signature: config.email.signature,
    }

    return mail.send({
        to: user.username,
        subject: 'Congratulations!',
        text: text(data),
        html: html(data),
    })
}