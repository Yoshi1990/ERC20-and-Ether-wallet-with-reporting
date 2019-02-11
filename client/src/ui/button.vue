<template>
	<component :is="type === 'a' ? 'a' : 'button'" :type="type === 'a' ? '' : type" class="button" :class="{
		'button--loading': loading,
		['button--' + (confirm ? confirmColor : color)]: true
	}" @click="e => $emit('click', e)">
		<div class="button__content" v-if="!alternative" key="content"><slot></slot></div>
		<div class="button__alternative center-wrapper" v-else key="alt">
			<div class="loader" v-if="loading"></div>
			<template v-else-if="confirm">{{ confirm === true ? 'Confirm?' : confirm }}</template>
		</div>
	</component>
</template>

<script>
export default {
	props: {
		type: {
			type: String,
			default: 'button',
		},
		loading: {
			type: Boolean,
			default: false,
		},
		confirm: {
			type: [Boolean, String],
			default: false,
		},
		confirmColor: {
			type: String,
			default: 'warning',
		},
		color: {
			type: String,
			default: 'secondary',
		},
	},
	computed: {
		alternative() {
			return this.loading || this.confirm
		}
	},
	watch: {
		alternative(v) {
			let el = this.$el
			let style = el.style
			if (v) {
				// Keep old values
				el.__width_old = style.width
				el.__height_old = style.height

				// Set element width/height as current values
				if (!style.width) {
					style.width = el.offsetWidth + 'px'
				}
				if (!style.height) {
					style.height = el.offsetHeight + 'px'
				}
			} else {
				style.width = el.__width_old
				style.height = el.__height_old
			}
		},
	},
}
</script>

<style lang="scss">
@import "~@/sass/variables";

.button {
	text-decoration: none;
	display: inline-block;
	color: $white;
	font-size: 0.8 * $font-size;
	border-radius: 4px;
	cursor: pointer;
	outline: none;
	border: none;
	position: relative;
	transition: background-color $transition-duration;
	padding: 0;

	> div {
		padding: $spacer * 2 / 3;
		text-align: center;
		letter-spacing: .1rem;
		text-transform: uppercase;
		text-decoration: none;
		white-space: nowrap;
	}

	&__alternative {
		width: 100%;
		min-height: 100%;
		overflow: hidden;
	}

	&:disabled {
		opacity: 0.5;
	}

	&--loading, &:disabled {
		pointer-events: none;
		cursor: auto;
	}

	// Colors (TODO: foreach)
	&--primary {
		background-color: $primary;
		&:hover { background-color: lighten($primary, $color-interval); }
	}
	&--secondary {
		background-color: $secondary;
		&:hover { background-color: lighten($secondary, $color-interval); }
	}
	&--success {
		background-color: $success;
		&:hover { background-color: lighten($success, $color-interval); }
	}
	&--warning {
		background-color: $warning;
		&:hover { background-color: lighten($warning, $color-interval); }
	}
	&--danger {
		background-color: $danger;
		&:hover { background-color: lighten($danger, $color-interval); }
	}
}
</style>