const mail = require('@/app/email')
const html = require('./html')
const text = require('./text')
const config = require('@/configs/app')

/**
 * @param {User} user
 */
module.exports = (user, origin) => {
    const data = {
        link: origin + '/auth/verify/' + user.getSignupHash(),
        sentense: config.email.signup_message,
        signature: config.email.signature,
    }

    return mail.send({
        to: user.username,
        subject: 'Verify your email address',
        text: text(data),
        html: html(data),
    })
}