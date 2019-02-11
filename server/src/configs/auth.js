const base_session = require('./session')
module.exports = {
    session: {
        ...base_session,
        key: 'auth',
        maxAge: 15 * 86400, // 15 days
        encrypt: false,
    },
    // Max age when the cookie is deleted on browser closed
    defaultMaxAge: 3600,
}