const path = require("path");
const webpack = require("webpack");
const HtmlWebPackPlugin = require("html-webpack-plugin");
const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const CleanWebpackPlugin = require("clean-webpack-plugin");

const targetDir = "dist";

module.exports = (env, argv) => {
	env = env || process.env;

	const isProduction = argv.mode === "production";
	const isDevelopment = !isProduction;

	const config = {
		entry: "./src/index.tsx",

		output: {
			filename: "[name].bundle.js",
			chunkFilename: "[name].chunk.js",
			path: path.join(__dirname, targetDir),
		},

		devtool: isDevelopment
			? "source-map"
			: undefined,

		resolve: {
			extensions: [".ts", ".tsx", ".js", ".json"],
			alias: {
				"vscode": require.resolve("monaco-languageclient/lib/vscode-compatibility")
			}
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
				template: "./src/index.ejs",
				filename: "./index.html",
				env: {
					includeMatomo: isProduction && !!env["MATOMO_URL"] && !!env["MATOMO_ENABLED"],
					matomoUrl: env["MATOMO_URL"] ? env["MATOMO_URL"].trim() : undefined,
				},
				minify: {
					collapseWhitespace: isProduction,
				}
			}),
			new MonacoWebpackPlugin({
				languages: [],
			}),
			new CopyWebpackPlugin([
				{ from: "assets" },
				{ from: "CNAME" },
			]),
			new CleanWebpackPlugin(targetDir),
			new webpack.DefinePlugin({
				VERSION: JSON.stringify(require("./package.json").version),
				DEV: JSON.stringify(isDevelopment),
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
