const path = require("path");
const webpack = require("webpack");
const HtmlWebPackPlugin = require("html-webpack-plugin");
const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = (env, argv) => {
	const config = {
		entry: "./src/index.tsx",

		output: {
			filename: "[name].bundle.js",
			chunkFilename: "[name].chunk.js",
			path: path.join(__dirname, "dist"),
		},

		devtool: argv.mode === "development"
			? "source-map"
			: undefined,

		resolve: {
			extensions: [".ts", ".tsx", ".js", ".json"]
		},

		module: {
			rules: [
				{ test: /\.(gv|dot)$/, use: ["raw-loader"] },
				{ test: /\.render\.js$/, use: ["file-loader"] },
				{ test: /\.html$/, use: ["html-loader"] },
				{ test: /\.tsx?$/, use: ["ts-loader"] },
				{ test: /\.css$/, use: ["style-loader", "css-loader"] },
				{ enforce: "pre", test: /\.js$/, loader: "source-map-loader", exclude: [/node_modules/] },
			]
		},

		plugins: [
			new HtmlWebPackPlugin({
				template: "./src/index.html",
				filename: "./index.html"
			}),
			new MonacoWebpackPlugin({
				languages: [],
			}),
			new CopyWebpackPlugin([
				{ from: "assets" },
				{ from: "CNAME" },
			]),
			new webpack.DefinePlugin({
				VERSION: JSON.stringify(require("./package.json").version),
				DEV: argv.mode === "development",
			}),
			new webpack.ProvidePlugin({
				$: 'jquery',
				jQuery: 'jquery',
				'window.jQuery': 'jquery',
				Popper: ['popper.js', 'default']
			}),
		],

		node: {
			fs: "empty",
			child_process: "empty",
			net: "empty",
			crypto: "empty",
		}
	};
	return config;
};
