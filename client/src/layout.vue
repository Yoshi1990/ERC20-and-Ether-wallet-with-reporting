<template>
	<div v-if="!$store.state.boot.loading" ref="container">
		<!-- Auth -->
		<authLayout v-if="!user"></authLayout>

		<!-- Pages -->
		<transition name="fade-top" mode="out-in" @before-enter="$refs.container.style.overflow = 'hidden'" @after-enter="$refs.container.style.overflow = null">
			<router-view v-if="user"></router-view>
		</transition>
	</div>
</template>

<script>
export default {
	computed: {
		user() {
			return this.$store.state.auth.user
		}
	},
	mounted() {
		// Catch all 401 logged out (session must be dead)
		this.$http.interceptors.response.use(null, err => {
			if (err.response && (err.response.status === 401 || err.response.status === 423)) {
				this.$store.dispatch('boot/loadData')
			}
			throw err
		})
		
		// Load boot
		this.$store.dispatch('boot/loadData')
	},
	components: {
		authLayout: require('@/auth/ui/layout').default,
	},
}
</script>

<style lang="scss">
@import "~@/sass/index";
</style>