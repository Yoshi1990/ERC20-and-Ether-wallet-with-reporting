import Vue from 'vue'

export const namespaced = true

export const state = {
	loading: true,
	// ... extra loaded boot data
}

export const actions = {
	/** Load app boot data */
	loadData({ commit }) {
		commit('setLoading', true)
		commit('pageLoader/setLoading', {
			loading: true,
			name: 'boot',
		}, { root: true })

		return Vue.$http.get('boot/app').then(
			({ data }) => {
				// Authed
				commit('auth/onLogin', data.user, { root: true })
				delete data.user

				// Other data avaible on $root.boot
				commit('onData', data)
				
				commit('setLoading', false)
				commit('pageLoader/setLoading', {
					loading: false,
					name: 'boot',
				}, { root: true })
			},
			error => {
				//TODO: main error
				console.error(error)
			}
		)
	},
}

export const mutations = {
	/** Set boot data */
	onData(state, data) {
		for (let key in data) {
			data.hasOwnProperty(key) && Vue.set(state, key, data[key])
		}
	},
	/** Set boot data as loading or not */
	setLoading(state, bool) {
		state.loading = !!bool
	},
}