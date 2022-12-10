const path = require("path");
const webpack = require("webpack");
const HtmlWebPackPlugin = require("html-webpack-plugin");
const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

module.exports = (env, argv) => {
	env = env || process.env;

	const isProduction = argv.mode === "production";
	const isDevelopment = !isProduction;

	const config = {
		entry: "./src/index.tsx",

		output: {
			hashFunction: "sha256",
			filename: "[name].bundle.js",
			chunkFilename: "[name].chunk.js",
			path: path.join(__dirname, "dist"),
		},

		devtool: isDevelopment
			? "source-map"
			: undefined,

		resolve: {
			extensions: [".ts", ".tsx", ".js", ".json"],
			alias: {
				"vscode": require.resolve("monaco-languageclient/lib/vscode-compatibility"),
				"jquery": "jquery/dist/jquery.slim.js",
			}
		},

		module: {
			rules: [
				{ test: /\.(gv|dot)$/, use: ["raw-loader"] },
				{ test: /\.render\.js$/, use: ["file-loader"] },
				{ test: /\.html$/, use: ["html-loader"] },
				{ test: /\.tsx?$/, use: ["ts-loader"] },
				{ test: /\.s?css$/, use: ["style-loader", "css-loader", "sass-loader"] },
				{ enforce: "pre", test: /\.js$/, loader: "source-map-loader", exclude: [/node_modules/] },
			]
		},

		plugins: [
			new HtmlWebPackPlugin({
				template: "./src/index.ejs",
				filename: "./index.html",
				env: {
					includeMatomo: isProduction && !!env["MATOMO_API_BASE"] && !!env["MATOMO_ENABLED"],
					// Has to end with a trailing forward slash!
					matomoApiBase: env["MATOMO_API_BASE"] ? env["MATOMO_API_BASE"].trim() : undefined,
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
			new CleanWebpackPlugin(),
			new webpack.DefinePlugin({
				VERSION: JSON.stringify(require("./package.json").version),
				DEV: JSON.stringify(isDevelopment),
			}),
			new webpack.ProvidePlugin({
				$: "jquery",
				jQuery: "jquery",
				"window.jQuery": "jquery",
				Popper: ["popper.js", "default"],
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
