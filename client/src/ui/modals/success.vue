<template>
	<modal @close="$emit('close')">
		<h3>Your transaction has been sent!</h3>
		<ui-button color="success" @click="$emit('close')" style="width: 100%">Ok, thanks.</ui-button>
	</modal>
</template>

<script>
export default {
	components: {
		modal: require('@/ui/modal').default,
		uiButton: require('@/ui/button').default,
	},
}
</script>