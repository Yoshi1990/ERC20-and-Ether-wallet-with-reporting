<template>
	<modal @close="$emit('close')">
		<h3>Your account has been created.</h3>
		<p>Please check your emails to access your personal page.</p>
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