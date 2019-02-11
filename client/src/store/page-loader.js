import Vue from 'vue'

export const namespaced = true

export const state = {
	loadings: {},
}

// Element is outside vue
const loader = document.querySelector('.page-loader .page-loader__loader')

export const mutations = {
	/**
	 * Add/remove a loading
	 * Params: boolean, or { loading: boolean, name: name of what's loading }
	 */
	setLoading(state, data) {
		if (typeof data === 'boolean') {
			data = { loading: data, name: 'default' }
		}

		if (data.loading) {
			Vue.set(state.loadings, data.name, true)
		} else {
			Vue.delete(state.loadings, data.name)
		}

		// Update ui
		loader.style.display = Object.keys(state.loadings).length > 0 ? 'block' : 'none'
	},
}