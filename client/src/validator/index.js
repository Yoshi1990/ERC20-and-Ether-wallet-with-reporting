/* global SERVER */

// Simply add an error to the error object
const addError = (obj, field, alias, msg) => {
	if (alias) {
		addError(obj, alias, false, msg)
	}
	if (obj[field]) {
		if (Array.isArray(obj[field])) {
			obj[field].push(msg)
		} else {
			obj[field] = [obj[field], msg]
		}
	} else {
		obj[field] = msg
	}
}

/**
 * Check data with passed rules, or throw an error
 * @param	{Object}	$data
 * @param	{Object}	$rules
 * @return	{Object}					Modified data object
 */
export const validate = (data, rules) => {
	let res = {}
	let errors = {}
	let promises = []

	for (let field in rules) {
		let rule = rules[field]
		let value = data[field]
		let stopErrors = false
		
		// Shown name in errors
		let name = rule.name || field
		let alias = rule.alias

		// Check for the type of data
		// Param: values of 'typeof' and 'array'
		let type = typeof value
		if (rule.type && type !== 'undefined' && value !== null) {
			switch(rule.type) {
				case 'array':
					type = 'array'
					if (value && !Array.isArray(value)) {
						addError(errors, field, alias, name + ' should be an array')
						stopErrors = true
					}
					break
				case 'boolean':
					type = 'boolean'
					if (typeof value === 'string') value = value.toLowerCase()
					switch (value) {
						case 'true': case 't': case 'on': case true: case 1:
							value = true
							break
						case 'false': case 'f': case 'off': case '': case false: case 0:
							value = false
							break
						default:
							addError(errors, field, alias, 'Invalid ' + name)
							stopErrors = true
							break
					}
					break
				//TODO: numbers with parseFloat
				default:
					if (type !== rule.type) {
						addError(errors, field, alias, 'Invalid ' + name)
						stopErrors = true
					}
					break
			}
		}
		if (stopErrors) continue

		// Validate sub values
		if (type === 'array') {
			res[field] = []
			for (let i = 0, l = value.length; i < l; i++) {
				try {
					res[field].push(validate({ _: value[i] }, { _: { name, ...rule.rules } }))
				} catch (err) {
					if (err.validation) {
						if (!errors[field]) errors[field] = {}
						errors[field][i] = err.validation._
					} else {
						throw err
					}
				}
			}
		} else if (type === 'object') {
			try {
				res[field] = validate(value, rule.rules)
			} catch (err) {
				console.log(err.validation)
				if (err.validation) {
					errors[field] = err.validation
				} else {
					throw err
				}
			}
		}

		// Rules to make first, that stops searching for errors
		for (let rule_name in rule) {
			let param = rule[rule_name]
			switch (rule_name) {
				// Check that a field is filled
				// Param: true
				case 'required':
					if (param && (!value || (value + '').trim() === '')) {
						addError(errors, field, alias, 'Missing ' + name)
						stopErrors = true
					}
					break
				
				// Set a default value for a field
				// Params: default
				case 'default':
					if (!param) throw new Error('Missing parameter for rule \'default\'')
					if (!value || (value + '').trim() === '') {
						value = param
						stopErrors = true
					}
					break
			}
			if (stopErrors) break
		}
		
		// Call every other rules
		if (stopErrors) continue
		for (let rule_name in rule) {
			let param = rule[rule_name]
			switch (rule_name) {
				// Call a custom function
				// Param: function(value, { field, rule, rules, data }), returns the new / old value, throws an error
				case 'custom':
					if (!param) throw new Error('Missing parameter for rule \'custom\'')
					promises.push(Promise.resolve()
						.then(() => param(value, { field, rule, rules, data, results: res }))
						.then(value => res[field] = value)
						.catch(err => {
							addError(errors, field, alias, err.message)
							return err
						})
					)
					break
				
				// Maximum value (>)
				// Param: max value
				case 'max':
					if (!param) throw new Error('Missing parameter for rule \'max\'')
					switch (type) {
						case 'number':
							if (value > param) {
								addError(errors, field, alias, 'The ' + name + ' is too big (max ' + param + ')')
							}
							break
						case 'object':
							if (Object.keys(value).length > param) {
								addError(errors, field, alias, 'Invalid ' + name)
							}
							break
						case 'array':
							if (value.length > param) {
								addError(errors, field, alias, 'The ' + name + ' is too big (max ' + param + ')')
							}
							break
						default:
							if ((value + '').length > param) {
								addError(errors, field, alias, 'The ' + name + ' is too long (max ' + param + ' characters)')
							}
							break
					}
					break
				
				// Minimum value (<)
				// Param: min value
				case 'min':
					if (param === null || param === undefined) throw new Error('Missing parameter for rule \'min\'')
					switch (type) {
						case 'number':
							if (value < param) {
								addError(errors, field, alias, 'The ' + name + ' is too small (min ' + param + ')')
							}
							break
						case 'object':
							if (Object.keys(value).length < param) {
								addError(errors, field, alias, 'Invalid ' + name)
							}
							break
						case 'array':
							if (value.length < param) {
								addError(errors, field, alias, 'The ' + name + ' is too small (min ' + param + ')')
							}
							break
						default:
							if ((value + '').length < param) {
								addError(errors, field, alias, 'The ' + name + ' is too small (min ' + param + ' characters)')
							}
							break
					}
					break
				
				// Value between 2 values (min < value < max)
				// Param: [min, max]
				case 'between':
					if (!param && !Array.isArray(param)) throw new Error('Missing/wrong parameter for rule \'between\'')
					var lg
					switch (type) {
						case 'number':
							if (param[0] > value || param[1 < value]) {
								addError(errors, field, alias, 'The ' + name + ' must be between ' + param[0] + ' and ' + param[1])
							}
							break
						case 'object':
							lg = Object.keys(value).length
							if (param[0] > lg || param[1 < lg]) {
								addError(errors, field, alias, 'Invalid ' + name)
							}
							break
						case 'array':
							lg = value.length
							if (param[0] > lg || param[1 < lg]) {
								addError(errors, field, alias, 'Invalid ' + name)
							}
							break
						default:
							lg = (value + '').length
							if (param[0] > lg || param[1 < lg]) {
								addError(errors, field, alias, 'The ' + name + ' must be between ' + param[0] + ' and ' + param[1] + ' characters')
							}
							break
					}
					break
				
				// Check against a regex
				// Value: regex
				case 'pattern':
					if (!param) throw new Error('Missing parameter for rule \'regex\'')
					if (typeof param === 'string') param = new RegExp(param)
					if (!param.test(value + '')) {
						addError(errors, field, alias, 'Invalid ' + name)
					}
					break
				
				// Check for emails
				// Param: true
				case 'email':
					if (param && !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/i.test(value + '')) {
						addError(errors, field, alias, 'Invalid email address')
					}
					
					// Reformat email address on server
					if (SERVER) {
						// TODO: prevent temp emails here

						value = value.toLowerCase()

						// Remove dots from gmail addresses
						if (/@gmail\.com$/i.test(value)) {
							value = value.substr(0, value.length - 4)	// Remove .com
							value = value.replace(/\.+/g, '')	// Remove dots
							value += '.com'						// Append .com
						}
					}
					break
				
				// Enums
				case 'enum':
					if (!param || !Array.isArray(param)) throw new Error('Missing/wrong parameter for rule \'enum\'')
					if (!param.includes(value)) {
						addError(errors, field, alias, 'Invalid ' + name)
					}
					break
			}
		}

		res[field] = value
	}

	// All custom function have been resolved
	return Promise.all(promises).then(() => {
		// Return checked values
		if (Object.keys(errors).length === 0) {
			return res
		}

		// Throw errors
		let err = new Error('Please check your inputs')
		err.expose = true
		err.status = 400
		err.toJson = () => errors
		throw err
	})
}

/** Transform anything into an error object */
export const format = err => {
	if (typeof err !== 'object') {
		return { global: err }
	}

	if (err instanceof Error) {
		// Axios error
		if (err.request && err.response) {
			// Received data
			if (err.response.data) {
				return format(err.response.data)
			}

			return { global: err.message }
		}

		// toJson function
		if (typeof err.toJson === 'function') {
			return err.toJson()
		}

		// Normal error
		if (!err.expose && process.env.NODE_ENV !== 'production') console.warn(err)
		return {
			[err.field ? err.field : 'global']: err.expose ? err.message : 'Something went wrong'
		}
	}

	// Already an error object
	return err
}

/*
Tests:


try {
	const validate = require('@/validator').validate
	const res = validate({
		username: 'blunt',
		email: 'email@address.com',
		subobj: {
			size: 185,
		},
		roles: ['admin', 'master'],
		arrayObj: [{
			test: 'super',
		}],
		uselessProp: true,
	}, {
		username: {
			required: true,
			min: 2,
			max: 50,
		},
		email: {
			required: true,
			email: true,
		},
		subobj: {
			type: 'object',
			rules: {
				size: {
					min: 100,
					max: 300,
				},
			},
		},
		roles: {
			type: 'array',
			rules: {
				enum: ['admin', 'master', 'noob'],
			},
		},
		arrayObj: {
			type: 'array',
			rules: {
				type: 'object',
				min: 2,
				rules: {
					test: {
						required: true,
					},
				},
			},
		},
	})
	console.log('res', res)
} catch (err) {
	console.log('error', err.toJson())
}
*/