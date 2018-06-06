export class FileSaver {
	private _link: HTMLAnchorElement;
	constructor() {
		this._link = document.createElement("a");
		document.body.appendChild(this._link);
		this._link.style.display = "none";
	}
	public save(data: any, fileName: string) {
		const blob = data instanceof Blob
			? data
			: new Blob([data], { type: "octet/stream" });

		const url = window.URL.createObjectURL(blob, { oneTimeOnly: true });
		this._link.href = url;
		this._link.download = fileName;
		this._link.click();
		window.URL.revokeObjectURL(url);
	}

	public saveImage(image: HTMLImageElement, fileName: string) {
		this._link.href = image.src;
		this._link.download = fileName;
		this._link.click();
	}

	public saveBase64(base64Data: string, fileName: string): Promise<void> {
		var url = "data:image/png;base64," + base64Data;
		return fetch(url)
			.then(res => res.blob())
			.then(blob => this.save(blob, fileName));
	}
}
