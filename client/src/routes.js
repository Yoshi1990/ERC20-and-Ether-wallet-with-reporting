import store from '@/store'
const loading = bool => store.commit('pageLoader/setLoading', bool)

export default [
	{
		name: 'wallet',
		path: '/',
		component: () => {
			loading(true)
			return import('@/pages/wallet').then(res => {
				loading(false)
				return res
			})
		},
	},
]