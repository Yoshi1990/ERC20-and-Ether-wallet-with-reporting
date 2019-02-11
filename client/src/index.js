import 'babel-polyfill'
import Vue from 'vue'
import VueRouter from 'vue-router'
import Layout from './layout'
import PagesRoutes from './routes'
import axios from 'axios'
import store from './store'

Vue.$http = Vue.prototype.$http = axios.create({
	baseURL: '/api/',
	responseType: 'json',
	headers: { 'X-Requested-With': 'axios' },
})

Vue.use(VueRouter)
const router = new VueRouter({
	mode: 'history',
	routes: PagesRoutes,
	base: '/',
})

// Debug tool (allow $console access in vue's html)
if (process && process.env && process.env.NODE_ENV === 'development') {
	Object.defineProperty(Vue.prototype, '$console', {
		get() { return console }
	})
}

// Filters
Vue.filter('erc20', value => {
	if (!value && value !== 0) return '?'
	value = value.toString().replace(/\d(?=(\d{3})+\.)/g, '$& ')
	for (let i = 0; i < 10; i++) {
		value = value.replace(/(\.\d{3}( \d{3})*)(\d)/, '$1 $3')
	}
	return value
})
Vue.filter('usd', value => {
	if (!value && value !== 0) return '?'
	return value.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$& ')
})

new Vue({
	el: '#main',
	router,
	store,
	render: h => h(Layout)
})