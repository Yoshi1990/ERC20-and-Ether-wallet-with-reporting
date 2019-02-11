const { getOptions } = require('loader-utils')
const ejs = require('ejs')
const ejsUtils = require('ejs/lib/utils')
const juice = require('juice')
const path = require('path')
const fs = require('fs')
const styleRegex = /<style\s*>([\s\S]*?)<\/style\s*>/ig

//TODO: fix __filename

/**
 * Find all regex matching string inside a string
 * @param {RegExp} regex Regex to search, don't forget 'g' flag
 * @param {String} string String to search in
 */
const pregMatchAll = (regex, string) => {
	let res = []
	let match
	while (match = regex.exec(string)) {
		res.push(match)
	}
	return res
}

/**
 * Resolve include full path
 * @param {String} filename Filename from <% include('filename') %>
 */
const resolveInclude = (filename) => {
	return path.resolve(__dirname, filename + '.ejs')
}

/*
 * Compile the file with EJS and replace it's style tags by inline css
 */
class EjsEmailCompiler {
	/**
	 * Find all <% include %> codes and build ann array of { path, source, names: [name in include(name)] }
	 * @param {String} source Source code
	 */
	findIncludes(source) {
		// Build include regex
		const options = this.options
		const delim = ejsUtils.escapeRegExpChars(options.delimiter)
		const open = ejsUtils.escapeRegExpChars(options.openDelimiter)
		const close = ejsUtils.escapeRegExpChars(options.closeDelimiter)
		const regex = new RegExp(open + delim + '.\\s*include\\s*\\(\\s*([\\s\\S]*?)\\s*(,[\\s\\S]*?|\\)\\s*)' + delim + close, 'g')

		let template_by_path = {}
		let full_code = source
		let templates = [{
			names: ['__main'],
			source,
		}]
		let index = 0
		while (true) {
			let data = templates[index++]
			if (!data) break
			
			// Find all includes
			let includes = pregMatchAll(regex, data.source)
			
			for (let include of includes) {
				let name = eval(include[1])
				let path = resolveInclude(name)

				// Add to template list
				if (!template_by_path.hasOwnProperty(path)) {
					let tpl = template_by_path[path] = {
						names: [name],
						path,
						placeholder: Math.random().toFixed(32).substr(2),
						original: include[0],
						source: fs.readFileSync(path) + '',
					}

					// Replace in source code
					full_code = full_code.replace(
						include[0],
						'<!-- ejscode-' + tpl.placeholder + '-start -->'
						+ tpl.source
						+ '<!-- ejscode-' + tpl.placeholder + '-end -->'
					)

					templates.push(tpl)
				} else {
					// Add alias name
					let names = template_by_path[path].names
					if (names.indexOf(name) < 0) {
						names.push(name)
					}
				}
			}
		}

		this.templates = templates
		this.full_code = full_code
	}

	/**
	 * Extract style tags from templates source, and return them
	 */
	extractStyles() {
		const options = this.options
		let full_code = this.full_code
		let first = true
		let res = ''

		let styles = pregMatchAll(styleRegex, full_code)
		if (!styles.length) return ''
		
		for (let style of styles) {
			res += style[1] + '\n'

			// Style tag spacer
			let spacer = options.openDelimiter + options.delimiter
				+ '// ' + style[0].replace(/\r?\n/g, '\n// ')
				+ options.delimiter + options.closeDelimiter
			
			// Add <%= styles %> for the first tag
			if (first) {
				first = false
				spacer = options.openDelimiter + options.delimiter
					+ '- styles '
					+ options.delimiter + options.closeDelimiter
					+ spacer
			}
			
			full_code = full_code.replace(style[0], spacer)
		}

		//TODO: Sass?

		this.styles = res
		this.full_code = full_code
	}

	/**
	 * Apply style tags on html tags 
	 */
	juicify() {
		const options = this.options
		let full_code = this.full_code

		// Build template regex
        const delim = ejsUtils.escapeRegExpChars(options.delimiter)
        const open = ejsUtils.escapeRegExpChars(options.openDelimiter)
        const close = ejsUtils.escapeRegExpChars(options.closeDelimiter)
		const regex = new RegExp(open + delim + '[\\s\\S]*?' + delim + close, 'g')
		
		// Replace template code by placeholders (juice options sucks to do it)
		const placeholders = {}
        full_code = full_code.replace(regex, value => {
			while (true) {
				let name = '__placeholder' + Math.random().toString(32).substr(2) + '__'
				if (!placeholders[name]) {
					placeholders[name] = value
					return name
				}
			}
		})

		// Juicify
		//TODO: juice.juiceResources
		full_code = juice(full_code, {
			extraCss: this.styles,
		})

		// Keep first <style> tag as result
		let result_styles = full_code.match(styleRegex)
		if (result_styles) {
			result_styles = result_styles[0]
			full_code = full_code.replace(styleRegex, '')
		}
		else result_styles = null

        // Put template code back
		for (let id in placeholders) {
			full_code = full_code.replace(id, placeholders[id])
		}

		// Split full_code parts into templates
		let templates = this.templates.concat([]).reverse()
		for (let tpl of templates) {
			if (!tpl.placeholder) continue

			let open = '<!-- ejscode-' + tpl.placeholder + '-start -->'
			let close = '<!-- ejscode-' + tpl.placeholder + '-end -->'

			let open_index = full_code.indexOf(open)
			if (open_index < 0) continue

			let close_index = full_code.indexOf(close, open_index)
			if (!close_index) continue
			
			tpl.source = full_code.substring(open_index + open.length, close_index)
			full_code = full_code.substring(0, open_index)
				+ tpl.original
				+ full_code.substring(close_index + close.length, full_code.length)
		}

		this.templates[0].source = full_code
		this.styles = result_styles
	}

	/**
	 * Compile all ejs templates
	 */
	compileAll() {
		const options = this.options
		for (let template of this.templates) {
			let code = ejs.compile(template.source, {
				client: true,
				_with: false,
				localsName: 'data',
				async: !!options.async,
				delimiter: options.delimiter ? options.delimiter : '%',
				openDelimiter: options.openDelimiter ? options.openDelimiter : '<',
				closeDelimiter: options.closeDelimiter ? options.closeDelimiter : '>',
			})
			template.code = code.toString()
		}
	}

	/**
	 * Export all templates inside on file
	 * @param	{Object[]}	templates
	 */
	buildResult() {
		let codes = 'const styles = ' + JSON.stringify(this.styles) + '\n'

		// Generate templates[name] = { fn: code }
		for (let template of this.templates) {
			for (let name of template.names) {
				codes += 'templates[' + JSON.stringify(name) + '] = '
			}
			codes += '{ fn: ' + template.code + ' }\n'
		}

		return `let templates = {}
		${codes}
		function render(name, data) {
			if (templates.hasOwnProperty(name)) {
				return templates[name].fn(data, null, render)
			}
			return ''
		}
		module.exports = function (data) {
			return render('__main', data)
		}`
	}
}

module.exports = function (source) {
	// Options
	const options = getOptions(this) || {}
	options.delimiter = options.delimiter || '%'
	options.openDelimiter = options.openDelimiter || '<'
	options.closeDelimiter = options.closeDelimiter || '>'

	// Compiler
	const compiler = new EjsEmailCompiler()
	compiler.options = options

	// Find all templates in order
	compiler.findIncludes(source)

	// Mark as dependensies
	for (let template of compiler.templates) {
		if (template.path) this.addDependency(template.path)
	}
	
	// Extract all <style>
	compiler.extractStyles()
	
	// Juicify
	compiler.juicify()

	// Compile all templates
	compiler.compileAll()

	// Build result
	return compiler.buildResult()
}