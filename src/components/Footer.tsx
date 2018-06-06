import * as React from "react";

import { Version } from "./Version";

const style = {
	fontSize: "14px",
};

export const Footer = () => (
	<footer className="footer" style={style}>
		<div className="container-fluid">
			<span className="text-muted">
				Hosted on <a href="//github.com/nikeee/edotor.net">GitHub Pages</a>. Using {' '}
				<a href="//github.com/mdaines/viz.js">Viz.js</a>,{' '}
				<a href="//github.com/Microsoft/monaco-editor">Monaco</a> and{' '}
				<a href="//github.com/nikeee/dot-language-support">dot-language-support</a>.{' '}
			</span>
			<span className="text-muted float-right">
				<a href="//github.com/nikeee/edotor.net">Issues</a> {DEV && <Version />}
			</span>
		</div>
	</footer>
);
