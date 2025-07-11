interface Window {
	MonacoEnvironment: {
		getWorker(_: string, label: string): Worker;
	};
}
