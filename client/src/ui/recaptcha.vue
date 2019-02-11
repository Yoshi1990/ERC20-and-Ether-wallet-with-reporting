<template>
    <div></div>
</template>

<script>
// Load recaptcha js
let recaptchaLoaded = new Promise((resolve, reject) => {
    let fct = 'onRecaptchaLoad' + Math.random().toString(32).substr(2)
    window[fct] = resolve

    let script = document.createElement('script')
    script.src = 'https://www.google.com/recaptcha/api.js?onload=' + fct + '&render=explicit'
    document.body.appendChild(script)
})

export default {
    props: {
        sitekey: {
            type: String,
            required: true,
        },
    },
    created() {
        recaptchaLoaded.then(() => grecaptcha.render(this.$el, {
            sitekey: this.sitekey,
        }))
    },
}
</script>