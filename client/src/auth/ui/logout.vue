<template>
    <ui-button
        :loading="$store.state.auth.loadings.logout"
        title="Logout"
        @click="$store.dispatch('auth/logout')"
    ><span class="icon icon-logout"></span></ui-button>
</template>

<script>
export default {
    components: {
        uiButton: require('@/ui/button').default,
    },
}
</script>