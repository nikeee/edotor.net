interface Window {
	$: unknown;
	jQuery: unknown;

	MonacoEnvironment: {
		getWorker(_: string, label: string): Worker;
	};
}
