const path = require("path");
const webpack = require("webpack");
const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");

module.exports = () => {
	const config = {
		entry: "./src/index.tsx",

		output: {
			hashFunction: "sha256",
			filename: "[name].bundle.js",
			chunkFilename: "[name].chunk.js",
			path: path.join(__dirname, "dist"),
		},

		resolve: {
			extensions: [".ts", ".tsx", ".js", ".json"],
			alias: {
				"vscode": require.resolve("monaco-languageclient/lib/vscode-compatibility"),
			}
		},

		plugins: [
			new MonacoWebpackPlugin({
				languages: [],
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
