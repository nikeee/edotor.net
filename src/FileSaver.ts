export class FileSaver {
	#link: HTMLAnchorElement;
	constructor() {
		this.#link = document.createElement("a");
		document.body.appendChild(this.#link);
		this.#link.style.display = "none";
	}

	save(data: Blob | BlobPart, fileName: string) {
		const blob =
			data instanceof Blob ? data : new Blob([data], { type: "octet/stream" });

		const url = window.URL.createObjectURL(blob);
		try {
			this.#link.href = url;
			this.#link.download = fileName;
			this.#link.click();
		} finally {
			if (url) window.URL.revokeObjectURL(url);
		}
	}

	saveImage(image: HTMLImageElement, fileName: string) {
		this.#link.href = image.src;
		this.#link.download = fileName;
		this.#link.click();
	}

	saveBase64(base64Data: string, fileName: string): Promise<void> {
		const url = `data:image/png;base64,${base64Data}`;
		return fetch(url)
			.then(res => res.blob())
			.then(blob => this.save(blob, fileName));
	}
}
