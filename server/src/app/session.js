const crypto = require('crypto')

class Session {
    constructor(ctx, config) {
        this.ctx = ctx
        this.config = config

        // Force unsigned because we do it here
        config.signed = false
        
        this.created_at = null
        this.sess_id = null
        this.old_json = null
    }
    
    /** Fill ctx.session with session's data */
    load() {
        let ctx = this.ctx
        let cfg = this.config
        let name = cfg.key
        let cookie = this.ctx.cookies.get(name)
        if (cookie) {
            // 1. check length
            if (cookie.length > cfg.maxLength) {
                ctx.throw(500, 'session:cookie_too_long')
            }

            // 2. check HMAC: date.value.(HMAC name.date.value)
            let parts = cookie.toString().split('.', 3)
            let hmac = crypto.createHmac('sha256', cfg.secret)
            hmac.update(`${name}.${parts[0]}.${parts[1]}`)
            if (hmac.digest('base64') !== parts[2]) {
                ctx.throw(500, 'session:invalid_data')
            }

            // 3. verify date range (more than lifetime)
            let now = Date.now() / 1000
            this.created_at = parts[0]
            if (cfg.maxAge && this.created_at + cfg.maxAge < now) {
                ctx.throw(500, 'session:cookie_outdated')
            }

            // 4. decrypt
            cookie = parts[1]
            if (cfg.encrypt) {
                parts = cookie.split(':', 2)
                
                let iv = Buffer.from(parts[0], 'base64')
                let encrypted = Buffer.from(encryptedArray[1], 'base64')

                let decipher = Crypto.createDecipheriv(cfg.encrypt.algo, cfg.encrypt.password, iv)
                cookie = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString()
            } else {
                cookie = Buffer.from(cookie, 'base64').toString()
            }

            // Parse
            this.old_json = cookie
            return JSON.parse(this.old_json)
        }

        this.old_json = null
        return {}
    }

    /** Save the session */
    save() {
        let data = this.ctx.session
        
        // No session anymore
        if (!data || Object.keys(data).length === 0) {
            return this.remove()
        }

        let resend = false
        let cfg = this.config
        let now = Date.now() / 1000

        // Not created || renew
        if (!this.created_at || (cfg.renew && now > this.created_at + cfg.renew)) {
            this.created_at = now
            resend = true
        }

        // No changes
        let json = JSON.stringify(data)
        if (json !== this.old_json) {
            resend = true
        }

        if (resend) {
            let name = cfg.key
            let value = json

            // 1. encrypt (encrypted or not, final to base64)
            if (cfg.encrypt) {
                let iv = crypto.randomBytes(16)
                let cipher = crypto.createCipheriv(cfg.encrypt.algo, cfg.encrypt.password, iv)
                let encrypted = Buffer.concat([cipher.update(value), cipher.final()])
                value = iv.toString('base64') + ':' + encrypted.toString('base64')
            } else {
                value = (new Buffer(value)).toString('base64')
            }

            // 2. create date.value.(HMAC name.date.value)
            value = (Date.now() / 1000 >> 0) + '.' + value
            let hmac = crypto.createHmac('sha256', cfg.secret)
            hmac.update(name + '.' + value)
            value += '.' + hmac.digest('base64')

            // 3. check length
            if (value.length > cfg.maxLength) {
                ctx.throw(500, 'session:cookie_too_long')
            }

            // 4. set cookie
            this.ctx.cookies.set(name, value, cfg)
        }
    }
    
    /** Delete the session */
    async remove() {
        if (!this.old_json) return
        this.ctx.cookies.set(this.config.key)
    }
    
    /** Wrap a function with a session */
    static wrap(func, config) {
        return async function (ctx) {
            // Fill context with session
            let session = new Session(ctx, config)
            
            // Load session
            ctx.session = session.load()
            
            // Call function
            try {
                return await func.apply(this, arguments)
            } catch (err) {
                throw err
            } finally {
                try {
                    session.save()
                } catch (err) {
                    console.error('failed to save session', err)
                }
            }
        }
    }
}

module.exports = Session