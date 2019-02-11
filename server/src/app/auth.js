const config = require('@/configs/auth')
const SessionStore = require('./session')
const User = require('@/models/User')
const redis = require('./redis')

/*
 * Store in a secure cookie:
 * uid: user id
 * sid: rand session id generated
 * 
 * Store in redis as 's:uid:sid' the values:
 * ua: user agent string
 * d: last access date
 * ip: last access ip
 */
module.exports = {
	/** Return the authed user or throw an error */
	async required(ctx) {
		let user = await this.user(ctx)
		if (user) return user
		ctx.throw(401, 'auth:denied')
	},
	
	/** Return the authed user */
	async user(ctx) {
		// Load session
		let session_store = new SessionStore(ctx, config.session)
		try {
			ctx.session = session_store.load()
		} catch (err) {
			if (err.expose) throw err
			return null
		}
		if (!ctx.session || !ctx.session.sid || !ctx.session.uid) return null
		if (!ctx.session.remember_me) session_store.config = { ...config.session, maxAge: 0 }
		
		// 1. fetch session data
		let sess_key = `s:${ctx.session.uid}:${ctx.session.sid}`
		let sess = await redis.getAsync(sess_key)
		sess = JSON.parse(sess)
		if (!sess) {
			session_store.remove()
			return null
		}

		// 2. check browser still the same
		let ua = getUserAgentName(ctx)
		if (ua !== sess.ua) {
			// Delete + error
			session_store.remove()
			await redis.delAsync(sess_key)
			ctx.throw(401, 'auth:revoked')
		}

		// 3. load user
		let user = await User.query()
			.where('id', ctx.session.uid)
			.first()
		if (!user) {
			session_store.remove()
			return null
		}

		// 4. update session date/ip
		sess.ip = ctx.ip
		sess.d = Date.now() / 1000
		await redis.setAsync(sess_key, JSON.stringify(sess), 'EX', config.session.maxAge || config.defaultMaxAge, 'XX')
		
		// 5. update nb_login
		if (user.nb_login < 6) {
			const dateYMD = date => date.getYear() + date.getMonth() + date.getDate()
			if (dateYMD(user.updated_at) !== dateYMD(new Date)) {
				user.nb_login++
				user.patch({ nb_login: user.nb_login }).catch(err => {
					console.error('Failed to increment user.nb_login', err)
				})
			}
		}

		return user
	},
	
	/** Login by user id */
	async login(ctx, user_id, remember_me) {
		// Load session
		let sess_cfg = remember_me ? { ...config.session, maxAge: 0 } : config.session
		let session_store = new SessionStore(ctx, sess_cfg)
		try {
			ctx.session = session_store.load()
		} catch (err) {
			if (err.expose) throw err
			ctx.session = {}
		}

		// 1. generate session cookie
		ctx.session.uid = user_id * 1
		ctx.session.sid = Math.random().toString(32).substr(2)
		ctx.session.remember_me = !!remember_me

		// 2. write redis data
		let sess_key = `s:${ctx.session.uid}:${ctx.session.sid}`
		await redis.setAsync(sess_key, JSON.stringify({
			ua: getUserAgentName(ctx),
			ip: ctx.ip,
			d: Date.now() / 1000,
		}), 'EX', config.session.maxAge || config.defaultMaxAge, 'NX')

		// Save session cookie
		session_store.save()
	},

	/** Logout user */
	logout: SessionStore.wrap(async (ctx) => {
		if (!ctx.session || !ctx.session.uid || !ctx.session.sid) return

		// Delete from redis
		let sess_key = `s:${ctx.session.uid}:${ctx.session.sid}`
		await redis.delAsync(sess_key)

		// Delete session cookie
		delete ctx.session.uid
		delete ctx.session.sid
		delete ctx.session.remember_me
	}, config.session),

	/** List all sessions from an user */
	listSession(user_id) {
		return new Promise((resolve, reject) => {
			let cursor = '0'
			let keys = []

			const scan = () => redis.scan(cursor, 'MATCH', `s:${user_id}:*`, (err, res) => {
				if (err) {
					return reject(err)
				}

				// Update cursor
				cursor = res[0]

				// Add found results
				if (res[1].length) {
					keys.push.apply(keys, res[1])
				}

				// End of search
				if (cursor === '0') {
					// Fetch values
					redis.mget(keys, (err, sessions) => {
						if (err) return reject(err)

						for (let i = 0, l = keys.length; i < l; i++) {
							sessions[i] = JSON.parse(sessions[i])
							sessions[i].key = keys[i]
						}
						resolve(sessions)
					})
				} else {
					scan()
				}
			})
			scan()
		})
	},
}

//TODO:
const getUserAgentName = ctx => {
	let ua = ctx.req.headers['user-agent']
	if (!ua) return null
	return 'Unknown'
	//return 'Chrome @ Windows x64'
}