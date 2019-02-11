<template>
	<transition name="modal">
		<div class="modal__wrapper center-wrapper" @click.self="$emit('close')" @keyup.esc="$emit('close')">
			<div class="modal">
				<button type="button" class="modal__close" v-if="closable" @click="$emit('close')">&times;</button>
				<div class="modal__header" v-if="title">
					<slot name="header">{{ title }}</slot>
				</div>
				<div class="modal__body">
					<slot/>
				</div>
				<slot name="footer"/>
			</div>
		</div>
	</transition>
</template>

<script>
export default {
	props: {
		title: String,
		closable: { type: Boolean, default: true },
	},
}
</script>

<style lang="scss">
@import "~@/sass/variables";

.modal__wrapper {
	position: fixed;
	z-index: $zindexModal;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background-color: rgba($black, 0.3);
	overflow: hidden;
	transition: opacity .3s ease;
	cursor: pointer;
}
.modal {
	position: relative;
	padding: $spacer;
	background: $white;
	border-radius: 2px;
	box-shadow: 0 2px 8px rgba($black, .33);
	transition: transform .3s ease;
	cursor: auto;

	&__close {
		position: absolute;
		padding: $spacer / 2;
		top: 0;
		right: 0;
		background: none;
		border: none;
		outline: none;
		cursor: pointer;
	}

	&__header {

	}
	&__body {
		
	}
}

// Transition
.modal-enter, .modal-leave-active {
	opacity: 0;
}
.modal-enter .modal, .modal-leave-active .modal {
	transform: scale(1.1);
}
</style>