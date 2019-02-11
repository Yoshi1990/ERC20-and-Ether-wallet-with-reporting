<template>
	<div class="pagination" v-if="value && lastPage">
		<!-- Previous -->
		<ui-button :disabled="value <= 1" @click="$emit('input', value - 1)">&lt;&lt;</ui-button>
		
		<!-- 6 previous pages -->
		<ui-button v-if="value > 6" @click="$emit('input', 1)">1</ui-button>
		<ui-button v-if="value > 5" @click="$emit('input', value - 5)">{{ value - 5 == 1 ? 1 : '…' }}</ui-button>
		<ui-button v-if="value > 4" @click="$emit('input', value - 4)">{{ value - 4 }}</ui-button>
		<ui-button v-if="value > 3" @click="$emit('input', value - 3)">{{ value - 3 }}</ui-button>
		<ui-button v-if="value > 2" @click="$emit('input', value - 2)">{{ value - 2 }}</ui-button>
		<ui-button v-if="value > 1" @click="$emit('input', value - 1)">{{ value - 1 }}</ui-button>

		<!-- Current page -->
		<ui-button color="primary">{{ value }}</ui-button>

		<!-- 6 next pages -->
		<ui-button v-if="value < lastPage" @click="$emit('input', value + 1)">{{ value + 1 }}</ui-button>
		<ui-button v-if="value < lastPage - 1" @click="$emit('input', value + 2)">{{ value + 2 }}</ui-button>
		<ui-button v-if="value < lastPage - 2" @click="$emit('input', value + 3)">{{ value + 3 }}</ui-button>
		<ui-button v-if="value < lastPage - 3" @click="$emit('input', value + 4)">{{ value + 4 }}</ui-button>
		<ui-button v-if="value < lastPage - 4" @click="$emit('input', value + 5)">{{ value + 5 == lastPage ? lastPage : '…' }}</ui-button>
		
		<!-- Next -->
		<ui-button :disabled="value >= lastPage" @click="$emit('input', value + 1)">&gt;&gt;</ui-button>
	</div>
</template>

<script>
export default {
	props: {
		value: Number,
		lastPage: Number,
	},
	components: {
		uiButton: require('@/ui/button').default,
	},
}
</script>

<style lang="scss">
@import "~@/sass/variables";

.pagination {
	text-align: center;
	padding: $spacer;
}
</style>