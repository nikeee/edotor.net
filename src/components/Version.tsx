import * as React from "react";

export const Version = (props: any) => (
	<span {...props} title={`Version ${VERSION}`}>v{VERSION}</span>
);
