module.exports = {
	output: {
		filename: 'main.bundle.js',
	},
	module: {
		rules: [
			{
				test: /\.(js|jsx)$/,
				exclude: /(node_module)/,
				loader: 'babel-loader',
				query: {
					presets: [
						['latest', {module: false}]
					]
				}
			}
		]
	}
}
