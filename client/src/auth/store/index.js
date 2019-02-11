import Vue from 'vue'
import * as validator from '@/validator'
import validatorSignup from '@/validator/auth/signup'
import validatorLogin from '@/validator/auth/login'

export const namespaced = true

export const state = {
	user: null,
	loadings: {
		login: false,
		logout: false,
		signup: false,
		askReset: false,
		reset: null,
	},
	errors: {
		login: null,
		signup: null,
		askReset: null,
		reset: null,
	},
}

export const actions = {
	/** Log in the user by username / password */
	login({ commit }, data) {
		commit('setLoading', { type: 'login' })

		return validator.validate(data, validatorLogin)
			.then(data => Vue.$http.post('auth/login', data))
			.then(res => commit('onLogin', res.data))
			.catch(err => commit('onError', { type: 'login', err: validator.format(err) }))
	},
	/** Log out current user */
	logout({ commit }, nb_tries = 1) {
		commit('setLoading', { type: 'logout' })
		return Vue.$http.post('auth/logout').then(
			() => commit('onLogout'),
			() => {
				if (nb_tries < 3) {
					setTimeout(() => actions.logout({ commit }, nb_tries + 1), 500)
				} else {
					// Just delete the cookie
					document.cookie = 'auth=; expires=Thu, 01 Jan 1970 00:00:01 GMT'
					commit('onLogout')
				}
			}
		)
	},
	/** New signup */
	signup({ commit }, data) {
		// Loading
		commit('setLoading', { type: 'signup' })
		
		return validator.validate(data, validatorSignup)
			.then(data => Vue.$http.post('auth/signup', data))
			.then(res => {
				commit('onSignup', res.data)
				return true
			})
			.catch(err => {
				commit('onError', { type: 'signup', err: validator.format(err) })
				return err
			})
	},
	/** Ask to reset my password */
	askReset({ commit }, data) {
		commit('setLoading', { type: 'askReset' })
		return Vue.$http.post('auth/ask_reset', data).then(
			() => commit('onAskReset'),
			err => commit('onError', { type: 'askReset', err: validator.format(err) })
		)
	},
	/** Reset the password */
	reset({ commit }, data) {
		commit('setLoading', { type: 'reset' })
		return Vue.$http.post('auth/reset', data).then(
			res => commit('onReset', res.data),
			err => commit('onError', { type: 'reset', err: validator.format(err) })
		)
	},
}

export const mutations = {
	/** Set something as loading */
	setLoading(state, data) {
		state.loadings[data.type] = true
		state.errors[data.type] = null
	},
	/** User is now logged in */
	onLogin(state, data) {
		state.user = data
		state.loadings.login = false
		state.errors.login = null
	},
	/** User is now logged out */
	onLogout(state) {
		state.user = null
		state.loadings.logout = false
		state.errors.logout = null
	},
	/** User signup successful */
	onSignup(state) {
		state.loadings.signup = false
		state.errors.signup = null
	},
	/** User ased to reset it's password */
	onAskReset(state) {
		state.loadings.askReset = false
		state.errors.askReset = null
	},
	/** User has reset it's password */
	onReset(state, data) {
		state.user = data
		state.loadings.reset = false
		state.errors.reset = null
	},
	/** Error happened */
	onError(state, data) {
		state.errors[data.type] = data.err
		state.loadings[data.type] = false
	},
}