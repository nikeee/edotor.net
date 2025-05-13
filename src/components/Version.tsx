import * as React from "react";

const version = import.meta.env.VITE_VERSION;

export const Version = (props: any) => (
	<span {...props} title={`Version ${version}`}>v{version}</span>
);
