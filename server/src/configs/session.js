// Key generator: http://www.allkeysgenerator.com/Random/Security-Encryption-Key-Generator.aspx

module.exports = {
    key: 'data', // Cookie's name
    maxAge: 0, // Browser's session
    renew: 3600, // 1 hour
    maxLength: 1024, // Max data length inside the cookie
    secret: '', // At least 32 char long, the most important key here
    encrypt: { // false to disable
        algo: 'aes-256-cbc',
        password: '', // 128 bits
    },
}
