<script lang="ts">
	import { downloadIcon, type ProductRequest } from '$lib/types';
	import { onMount } from 'svelte';

	export let data: ProductRequest | null;

	function addTableRow(
		tableBodyElem: HTMLElement,
		version: string,
		description: string,
		date: string,
		downloadLink: string,
		index: number
	) {
		const trElem = document.createElement('tr');
		trElem.classList.add('hover');

		const thElem = document.createElement('th');
		thElem.innerHTML = index.toString();
		trElem.appendChild(thElem);

		const tdElemVersion = document.createElement('td');
		tdElemVersion.innerHTML = version;
		trElem.appendChild(tdElemVersion);

		const tdElemDescription = document.createElement('td');
		tdElemDescription.innerHTML = description;
		trElem.appendChild(tdElemDescription);

		const tdElemDate = document.createElement('td');
		tdElemDate.innerHTML = date;
		trElem.appendChild(tdElemDate);

		const tdElemDownloadLink = document.createElement('td');
		const linkElem = document.createElement('a');
		linkElem.href = downloadLink;
		linkElem.classList.add('btn', 'btn-info', 'btn-sm');
		linkElem.innerHTML = downloadIcon + ' &nbsp firmware';
		tdElemDownloadLink.appendChild(linkElem);

		trElem.appendChild(tdElemDownloadLink);

		tableBodyElem.appendChild(trElem);
	}

	let scale = 2.5;
	let pdfDocument = null;
	let pageNumber = 1;
	let currentPage: any = null;
	let canvas: HTMLCanvasElement;
	let context: CanvasRenderingContext2D | null = null;

	async function preparePdfEngine(url: string) {
		if (!(data != null && data.Product != null)) return;

		if (data.ProductVersion.schematic == '') return;

		context = canvas.getContext('2d');

		// Loaded via <script> tag, create shortcut to access PDF.js exports.
		const pdfjsLib = window['pdfjs-dist/build/pdf' as any];

		// The workerSrc property shall be specified.
		//@ts-ignore
		pdfjsLib.GlobalWorkerOptions.workerSrc = '//mozilla.github.io/pdf.js/build/pdf.worker.js';

		// Asynchronous download of PDF
		//@ts-ignore
		const loadingTask = pdfjsLib.getDocument(url);
		pdfDocument = await loadingTask.promise;
		currentPage = await pdfDocument.getPage(pageNumber);
		await render(scale);
	}

	let rendering = false;
	async function render(scale: number) {
		if (!currentPage || rendering) return;

		rendering = true;
		const viewport = await currentPage.getViewport({ scale: scale });
		canvas.width = viewport.width;
		canvas.height = viewport.height;

		// Render PDF page into canvas context
		const renderContext = {
			canvasContext: context,
			viewport: viewport
		};

		await currentPage.render(renderContext);
		rendering = false;
	}

	async function handleZoomIn() {
		scale += 0.1;
		await render(scale);
	}

	async function handleZoomOut() {
		scale -= 0.1;
		await render(scale);
	}

	onMount(async () => {
		if (!(data != null && data.Product != null)) return;

		const productContentElem = document.getElementById('product-content') as HTMLParagraphElement;
		const descriptionContentElem = document.getElementById(
			'description-content'
		) as HTMLParagraphElement;
		const usageContentElem = document.getElementById('usage-content') as HTMLParagraphElement;

		const downloadUserManualLinkElem = document.getElementById(
			'download-user-manual-link'
		) as HTMLAnchorElement;
		const downloadSchematicLinkElem = document.getElementById(
			'download-schematic-link'
		) as HTMLAnchorElement;

		const tutorialLinkElem = document.getElementById('tutorial-link') as HTMLAnchorElement;
		const githubLinkElem = document.getElementById('github-link') as HTMLAnchorElement;
		const productImageElem = document.getElementById('product-image') as HTMLImageElement;

		productContentElem.innerHTML = data.Product.Product;

		if (data.ProductVersion) {
			if (data.ProductVersion.schematic && data.ProductVersion.schematic.length != 0) {
				canvas = document.getElementById('pdfCanvas') as HTMLCanvasElement;
				const zoomInBtn = document.getElementById('zoomInBtn');
				const zoomOutBtn = document.getElementById('zoomOutBtn');
				zoomInBtn?.addEventListener('click', handleZoomIn);
				zoomOutBtn?.addEventListener('click', handleZoomOut);

				downloadSchematicLinkElem.href = data.ProductVersion.schematic;
				preparePdfEngine(data.ProductVersion.schematic);
			} else {
				const pdfDiv = document.getElementById('pdf-div') as HTMLDivElement;
				pdfDiv.classList.add('hidden');
			}

			descriptionContentElem.innerHTML = data.ProductVersion.description;

			usageContentElem.innerHTML = ''; //currently not used

			if (data.ProductVersion.user_manual && data.ProductVersion.user_manual.length != 0) {
				downloadUserManualLinkElem.href = data.ProductVersion.user_manual;
			} else {
				downloadUserManualLinkElem.classList.add('hidden');
			}

			if (data.ProductVersion.tutorial && data.ProductVersion.tutorial.length != 0) {
				tutorialLinkElem.href = data.ProductVersion.tutorial;
			} else {
				tutorialLinkElem.classList.add('hidden');
			}

			if (data.ProductVersion.github && data.ProductVersion.github.length != 0) {
				githubLinkElem.href = data.ProductVersion.github;
			} else {
				githubLinkElem.classList.add('hidden');
			}

			if (data.ProductVersion.picture && data.ProductVersion.picture.length != 0) {
				//set the src for the pic only if it exists, we will show a default picture otherwise
				productImageElem.src = data.ProductVersion.picture;
			}

			if (data.ProductVersion.firmwares && data.ProductVersion.firmwares.length != 0) {
				const firmwareTableBody = document.getElementById('firmware-table-body') as HTMLElement;

				data.ProductVersion.firmwares.map((firmware, index) => {
					addTableRow(
						firmwareTableBody,
						firmware.version,
						firmware.description,
						firmware.date,
						firmware.url,
						index + 1
					);
				});
			} else {
				const firmwareTable = document.getElementById('firmware-table') as HTMLElement;
				firmwareTable.classList.add('hidden');
			}
		}
	});
</script>

{@html data?.HtmlPage}
