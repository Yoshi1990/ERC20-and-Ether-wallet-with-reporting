const path = require('path')
const webpack = require('webpack')
const nodeExternals = require('webpack-node-externals')

//-----------------------------
//-- Base webpack config
//-----------------------------
const cfg = module.exports = {
	target: 'node',
	devtool: 'inline-source-map',
	name: 'server',
	entry: [
		path.join(__dirname, 'src/index.js'),
	],
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: '[name].js',
		libraryTarget: 'commonjs2',
	},
	externals: [
        nodeExternals({
            whitelist: ['webpack/hot/poll?1000'],
        }),
	],
	module: {
		rules: [],
	},
	resolve: {
		extensions: [],
		alias: {
			'@': path.resolve(__dirname, 'src'),
			'@client': path.resolve(__dirname, '../client/src'),
		},
		modules: [
			path.resolve(__dirname, 'node_modules')
		],
	},
	plugins: [
		new webpack.DefinePlugin({ SERVER: 'true' }),
        new webpack.NamedModulesPlugin(),
		new webpack.BannerPlugin({
			banner: "require('source-map-support').install({ hookRequire: true });",
			raw: true,
			entryOnly: false,
		}),
	],
	node: {
		__dirname: false,
		__filename: false,
		process: false,
		global: false,
		console: false,
		Buffer: false,
		setImmediate: false,
	},
}

// JS loader
cfg.resolve.extensions.push('.js')
cfg.module.rules.push({
	test: /\.js?$/,
	exclude: /node_modules/,
	use: [{
		loader: 'babel-loader',
		options: {
			presets: [[
				'@babel/preset-env',
				{
					targets: { node: 'current' },
					shippedProposals: true,
				},
			]],
			plugins: ['@babel/plugin-proposal-class-properties'],
		},
	}],
})

// Custom Email loader
cfg.resolve.extensions.push('.ejs')
cfg.module.rules.push({
	test: /emails\/.*\.ejs$/,
	use: [{
		loader: path.resolve(__dirname, 'src/views/emails/loader.js'),
	}]
})

if (process.env.NODE_ENV === 'production') {
	//-----------------------------
	//-- Production addons
	//-----------------------------
	cfg.mode = 'production'
} else {
	//-----------------------------
	//-- Development addons
	//-----------------------------
    cfg.mode = 'development'
    
	// Hot reload
	cfg.entry.unshift('webpack/hot/poll?1000')
	cfg.plugins.push(new webpack.HotModuleReplacementPlugin())
}