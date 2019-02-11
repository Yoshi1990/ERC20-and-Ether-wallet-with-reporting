const path = require('path')
const webpack = require('webpack')

//-----------------------------
//-- Base webpack config
//-----------------------------
const cfg = module.exports = {
	entry: {
		index: path.resolve(__dirname, 'src/index.js'),
		critical: path.resolve(__dirname, 'src/sass/critical.scss'),
	},
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: '[name].js',
		crossOriginLoading: 'anonymous',
	},
	module: {
		rules: [],
	},
	stats: { colors: true },
	resolve: {
		extensions: [],
		alias: {
			'@': path.resolve(__dirname, 'src'),
		},
	},
	plugins: [],
}

//-----------------------------
//-- Style variables
//-----------------------------
const sass = require('node-sass')
const postcss = require('postcss')
const icssUtils = require('icss-utils')
let style_variables = sass.renderSync({
	file: path.resolve(__dirname, 'src/sass/_variables.scss'),
})
style_variables = postcss.parse(style_variables.css)
style_variables = icssUtils.extractICSS(style_variables).icssExports

//-----------------------------
//-- Loaders
//-----------------------------

// JS
cfg.resolve.extensions.push('.js')
cfg.module.rules.push({
	test: /\.js$/,
	exclude: /node_modules/,
	use: [{
		loader: 'babel-loader',
		options: {
			presets: [[
				'env',
				{
					targets: { browsers: ['> 2%', 'IE 11', 'not op_mini all'] },
					useBuiltIns: true,
				}
			]],
			plugins: ['syntax-dynamic-import', 'syntax-object-rest-spread'],
		},
	}, {
		loader: 'eslint-loader',
	}],
})

// Eval js
cfg.resolve.extensions.push('.eval.js')
cfg.module.rules.push({
	test: /\.eval\.js$/,
	use: [
		...cfg.module.rules[0].use,
		'val-loader'
	],
	enforce: 'post',
})

// Vuejs
const { VueLoaderPlugin } = require('vue-loader')
cfg.resolve.extensions.push('.vue')
cfg.module.rules.push({
	test: /\.vue$/,
	use: ['vue-loader'],
})
cfg.plugins.push(new VueLoaderPlugin())

// Scss + css
cfg.resolve.extensions.push('.scss', '.css')
cfg.module.rules.push({
	test: /\.s?css$/,
	exclude: /critical\.scss$/,
	use: [
		'vue-style-loader',
		'css-loader',
		'sass-loader',
	],
})

// Critical css
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
cfg.module.rules.push({
	test: /critical\.scss$/,
	use: [
		MiniCssExtractPlugin.loader,
		'css-loader',
		'sass-loader',
	],
})
cfg.plugins.push(new MiniCssExtractPlugin({
	filename: '[name].css',
}))

// Assets
cfg.module.rules.push({
	test: /\.(png|jpeg|jpg|gif|woff|woff2|eot|ttf)$/,
	use: {
		loader: 'url-loader',
		options: {
			limit: 8192,
			name: '[name]-[hash].[ext]',
		},
	},
})

// Svg
cfg.module.rules.push({
	test: /\.svg$/,
	oneOf: [
		// Force asset mode
		{
			resourceQuery: /asset|inline|css/i,
			use: cfg.module.rules.find(rule => rule.test.test('file.png')).use
		},
		// SVG to Vue component
		{
			use: {
				loader: 'vue-svg-loader',
				options: { svgo: { plugins: [{removeViewBox: false }] } },
			},
		},
	],
})

//-----------------------------
//-- Extra plugins
//-----------------------------

// HTML pages
const HtmlWebpackPlugin = require('html-webpack-plugin')
const html_options = {
	config: require(__dirname + '/../server/config.js'),
	template: path.resolve(__dirname, 'src/html.ejs'),
	hash: true,
	minify: {
		collapseWhitespace: true,
	},
	excludeChunks: ['critical'],
}
cfg.plugins.push(new HtmlWebpackPlugin(html_options))

// Define all envs inside js scripts
const defines = { SERVER: 'false' }
for (let [key, value] of Object.entries(process.env)) {
	defines['process.env.' + key] = JSON.stringify(value)
}
cfg.plugins.push(new webpack.DefinePlugin(defines))

// Icon font
const WebfontPlugin = require('webfont-webpack-plugin').default
cfg.plugins.push(new WebfontPlugin({
	files: path.resolve(__dirname, 'src/assets/icons/**/*.svg'),
	dest: path.resolve(__dirname, 'src/assets/fonts'),
	template: 'scss',
	fontName: 'icons',
	formats: ['woff', 'woff2'],
	templateClassName: 'icon',
	templateFontPath: '~@/assets/fonts/',
	centerHorizontally: true,
	fixedWidth: true,
	normalize: true,
	fontHeight: 256,
}))

// Favicons
const WebappWebpackPlugin = require('webapp-webpack-plugin')
cfg.plugins.push(new WebappWebpackPlugin({
	logo: path.resolve(__dirname, 'src/assets/logo.svg'),
	theme_color: style_variables.primary,
	icons: {
		android: true,
		appleIcon: true,
		appleStartup: true,
		coast: false,
		favicons: true,
		firefox: true,
		windows: true,
		yandex: false,
	},
}))

if (process.env.NODE_ENV === 'production') {
	//-----------------------------
	//-- Production addons
	//-----------------------------
	cfg.mode = 'production'
	cfg.devtool = 'source-map'

	const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
	const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin')
	const cssnano = require('cssnano')
	cfg.optimization = {
		minimizer: [
			// Js compression
			new UglifyJsPlugin({
				sourceMap: true,
				uglifyOptions: { ecma: 8 },
			}),
			// Css optimization
			new OptimizeCSSAssetsPlugin({
				cssProcessor: cssnano,
				cssProcessorOptions: {
					sourcemap: true,
					discardComments: { removeAll: true },
					autoprefixer: { add: true, browsers: ['> 5%'] },
					zindex: false,
				},
				canPrint: false,
			}),
		],
	}
	
	// Security
	const SriPlugin = require('webpack-subresource-integrity')
	cfg.plugins.push(new SriPlugin({
		hashFuncNames: ['sha256', 'sha384'],
		enabled: true,
	}))
} else {
	//-----------------------------
	//-- Development addons
	//-----------------------------
	cfg.mode = 'development'
	cfg.devtool = 'cheap-module-eval-source-map'

	// Add sourceMap on every css rules
	for (let rule of cfg.module.rules) {
		if (!rule.test || !rule.use || !rule.test.test('file.css')) continue
		if (!Array.isArray(rule.use)) rule.use = [rule.use]
		rule.use.forEach((loader, i) => {
			if (typeof loader === 'string')	loader = rule.use[i] = { loader }
			if (!loader.options) loader.options = {}
			loader.options.sourceMap = true
		})
	}
}