import * as React from "react";

const version = import.meta.env.VITE_VERSION;

export default () => <span title={`Version ${version}`}>v{version}</span>;
