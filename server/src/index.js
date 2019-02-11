// Config 
try {
    require('../config')
} catch (err) {
    console.log('Failed to load config.js file.')
    console.log('Please copy the config.sample.js file into config.js, and edit it\'s content.')
    process.exit(1)
}

// Init objection
require('@/app/objection')

// Main scripts
require('@/app/koa')
require('@/app/ether')

// Exit app on hot reload failed
module.hot && module.hot.addStatusHandler(status => {
	if (['abort', 'fail'].indexOf(status) >= 0) {
		process.exit(1)
	}
})