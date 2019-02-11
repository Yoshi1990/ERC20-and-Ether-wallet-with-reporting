<template>
	<transition name="auth">
		<div class="auth-layout">
			<div class="auth-layout__left">
				<auth-login></auth-login>
			</div>
			<div class="auth-layout__right">
				<auth-signup></auth-signup>
			</div>
			<div class="auth-layout__logo">
				<logo></logo>
			</div>
		</div>
	</transition>
</template>

<script>
export default {
    components: {
		authLogin: require('@/auth/ui/login').default,
		authSignup: require('@/auth/ui/signup').default,
		logo: require('@/assets/logo.svg'),
	},
}
</script>

<style lang="scss">
@import "~@/sass/variables";

.auth-layout {
	width: 100%;
	height: 100%;
	z-index: $zindexAuth;
	position: fixed;
	overflow: auto !important;
	
	&__left, &__right {
		position: absolute;
		top: 0;
		padding: 170px 0 50px;
		width: 50%;
		min-height: 100%;
		background: $white;
		transition: transform $transition-duration ease-out;

		> form { margin: auto; }

		@include mobile {
			width: 100%;
			position: static;
			min-height: auto;
		}
	}
	&__left {
		left: 0;
	}
	&__right {
		right: 0;

		@include mobile {
			padding-top: 0;
		}
	}

	&__logo {
		top: 20px;
		height: 100px;
		position: absolute;
		width: 100px;
		left: 50%;
		transform: translateX(-50%);

		svg, img {
			width: 100%;
			height: 100%;
		}
	}
}

.auth-enter, .auth-leave-to {
	.auth-layout__left {
		transform: translateX(-100%);
	}
	.auth-layout__right {
		transform: translateX(100%);
	}
	.auth-layout__logo {
		transform: translateY(-200%)
	}
}
.auth-enter-active, .auth-leave-active {
	transition: vuejs $transition-duration;
}
</style>