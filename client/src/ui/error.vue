<template>
	<div v-if="show" class="error">
		<!-- Array error -->
		<template v-if="Array.isArray(data)">
			<!-- Multiple errors -->
			<li v-if="data.length > 1" v-for="(line, i) in data" :key="i">
				{{ line }}
			</li>
			<!-- Single error -->
			<template v-else>{{ data[0] }}</template>
		</template>
		<!-- Default to string -->
		<template v-else>{{ data }}</template>

		<!--TODO: Button ui -->
		<a :class="{ loading }" v-if="retry" @click="retry">Retry</a>
	</div>
</template>

<script>
export default {
	props: {
		data: [Array, String],
		retry: Function,
		loading: Boolean,
	},
	computed: {
		show() {
			let data = this.data
			return !!data && !(Array.isArray(data) && data.length === 0)
		}
	},
}
</script>

<style lang="scss">
@import "~@/sass/variables";
.error {
	color: $danger;
}
</style>