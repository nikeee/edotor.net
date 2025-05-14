export class FileSaver {
	private _link: HTMLAnchorElement;
	constructor() {
		this._link = document.createElement("a");
		document.body.appendChild(this._link);
		this._link.style.display = "none";
	}

	save(data: Blob | BlobPart, fileName: string) {
		const blob =
			data instanceof Blob ? data : new Blob([data], { type: "octet/stream" });

		const url = window.URL.createObjectURL(blob);
		try {
			this._link.href = url;
			this._link.download = fileName;
			this._link.click();
		} finally {
			if (url) window.URL.revokeObjectURL(url);
		}
	}

	saveImage(image: HTMLImageElement, fileName: string) {
		this._link.href = image.src;
		this._link.download = fileName;
		this._link.click();
	}

	saveBase64(base64Data: string, fileName: string): Promise<void> {
		const url = `data:image/png;base64,${base64Data}`;
		return fetch(url)
			.then(res => res.blob())
			.then(blob => this.save(blob, fileName));
	}
}
