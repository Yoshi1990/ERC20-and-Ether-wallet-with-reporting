import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
	modules: {
		pageLoader: require('./page-loader'),
		boot: require('./boot'),
		auth: require('@/auth/store'),
	},
})