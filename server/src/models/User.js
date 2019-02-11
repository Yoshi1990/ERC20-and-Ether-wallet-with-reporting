const { Model } = require('objection')
const Transfer = require('./Transfer')
const bcrypt = require('bcrypt-nodejs')
const crypto = require('crypto')
const algorithm = 'AES-256-CBC'

module.exports = class User extends Model {
	static tableName = 'users'

	/** Json data return when authed */
	toJsonAuth() {
		return {
			id: this.id,
			public_key: this.public_key,
			has_private_key: !!this.private_key,
			balance_eth: this.balance_eth || 0,
			balance_erc20: this.balance_erc20 || 0,
			nb_login: this.nb_login,
		}
	}

	async $beforeInsert(context) {
		await super.$beforeInsert(context)
		this.created_at = new Date()
	}

	async $beforeUpdate(queryOptions, context) {
		await super.$beforeUpdate(queryOptions, context)
		this.updated_at = new Date()
	}

	/**
	 * Compares a password to it's hash
	 * @param  {String}             password  the password...
	 * @return {Promise.<Boolean>}            whether or not the password was verified
	 */
	verifyPassword(password) {
		return new Promise((resolve, reject) => {
			bcrypt.compare(password + '', this.password + '', (err, res) => {
				if (err) reject(err)
				resolve(res)
			})
		})
	}

	/**
	 * Hash password field
	 * @return {Promise.<(String|void)>}  returns the hash or null
	 */
	static hashPassword(password) {
		// Aweful bcrypt
		return new Promise((resolve, reject) => {
			bcrypt.genSalt(12, (err, salt) => {
				if (err) return reject(err)
				bcrypt.hash(password + '', salt, null, (err, hash) => {
					if (err) return reject(err)
					resolve(hash)
				})
			})
		})
	}

	/**
	 * Encrypt private key with password
	 */
	static encryptPrivate(private_key, password) {
		const iv = crypto.randomBytes(16)
		const encryptor = crypto.createCipheriv(algorithm, password.padStart(32).substring(0, 32), iv)
		encryptor.setEncoding('hex')
		encryptor.write(private_key)
		encryptor.end()
		return iv.toString('hex') + ':' + encryptor.read()
	}

	/**
	 * Decrypt private key
	 */
	static decryptPrivate(private_key, password) {
		let [iv, text] = private_key.split(':', 2)
		iv = new Buffer(iv, 'hex')

		const decryptor = crypto.createDecipheriv(algorithm, password.padStart(32).substring(0, 32), iv)
    	return decryptor.update(text, 'hex', 'utf-8') + decryptor.final('utf-8')
	}

	getSignupHash() {
		return this.id + '-' + crypto.createHmac('sha256', '*Pnc7JChDxtz-3!D').update(this.id + '').digest('hex')
	}
	static async getUserByHash(hash) {
		let [id, md5] = hash.split('-', 2)
		if (!md5) return null

		let user = await this.query().where('id', id).where('verified', false).first()
		if (!user) return null
		
		if (user.getSignupHash() !== hash) return null
		return user
	}

	static relationMappings = {
		lastSentTransfer: {
			relation: Model.HasOneRelation,
			modelClass: Transfer,
			join: {
				from: 'users.public_key',
				to: 'transfers.from',
			},
		},
		lastReceivedTransfer: {
			relation: Model.HasOneRelation,
			modelClass: Transfer,
			join: {
				from: 'users.public_key',
				to: 'transfers.to',
			},
		},
	}
}