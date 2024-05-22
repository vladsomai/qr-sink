<script lang="ts">
	import { downloadIcon, type ProductRequest } from '$lib/types';
	import { onMount } from 'svelte';
	import Siema from 'siema';
	//@ts-ignore
	import * as pdfjsLib from 'pdfjs-dist/build/pdf.min.mjs';
	//@ts-ignore
	import * as pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs';

	export let data: ProductRequest | null;

	let siema: Siema;
	let siemaInterval: NodeJS.Timer;

	function addImageElement(pictureLink: string, parentDiv: HTMLDivElement) {
		const imgElem = document.createElement('img');
		imgElem.src = pictureLink;
		imgElem.alt = 'product';
		imgElem.classList.add('rounded-lg', 'object-contain');
		parentDiv.appendChild(imgElem);
	}

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

	let scale = 1;
	let pdfDocument = null;
	let pageNumber = 1;
	let currentPage: any = null;
	let canvas: HTMLCanvasElement;
	let parentCanvas: HTMLDivElement;
	let context: CanvasRenderingContext2D | null = null;

	async function preparePdfEngine(url: string) {
		if (!(data != null && data.Product != null)) return;
		if (data.ProductVersion.schematic == '') return;
		context = canvas.getContext('2d');
		const loadingTask = pdfjsLib.getDocument(url);
		pdfDocument = await loadingTask.promise;
		currentPage = await pdfDocument.getPage(pageNumber);
		await render(scale);
	}

	let rendering = false;

	async function render(scale: number) {
		if (rendering) {
			return;
		}

		if (!currentPage) {
			return;
		}
		rendering = true;
		const viewport = await currentPage.getViewport({ scale: scale });
		canvas.width = viewport.width;
		canvas.height = viewport.height;
		// Render PDF page into canvas context
		const renderContext = {
			canvasContext: context,
			viewport: viewport
		};
		const res = await currentPage.render(renderContext);
		res.promise = res.promise
			.then(() => {})
			.catch((err: any) => console.log(err))
			.finally(() => {
				rendering = false;
			});
	}

	async function handleZoomIn() {
		scale += 0.1;
		await render(scale);
	}
	async function handleZoomOut() {
		scale -= 0.1;
		await render(scale);
	}

	let lastX = 0;
	let lastY = 0;
	function pan(e: MouseEvent) {
		if (!mouseDown) return;

		if (lastX > e.clientX) {
			parentCanvas.scrollBy(5, 0);
		}

		if (lastX < e.clientX) {
			parentCanvas.scrollBy(-5, 0);
		}

		if (lastY > e.clientY) {
			parentCanvas.scrollBy(0, 5);
		}

		if (lastY < e.clientY) {
			parentCanvas.scrollBy(0, -5);
		}
		lastX = e.clientX;
		lastY = e.clientY;
	}

	function scalePdf(e: WheelEvent) {
		e.preventDefault();
		if (!e.ctrlKey) return;

		if (e.deltaY < 0) {
			handleZoomIn();
		} else {
			handleZoomOut();
		}
	}

	let mouseDown = 0;

	onMount(async () => {
		if (!(data != null && data.Product != null)) return;

		document.body.onmousedown = function () {
			++mouseDown;
		};
		document.body.onmouseup = function () {
			--mouseDown;
		};

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
		const productImageElem = document.getElementById('product-image') as HTMLDivElement;
		const productVideoElem = document.getElementById('product-video') as HTMLIFrameElement;

		productContentElem.innerHTML = data.Product.Product;

		if (data.ProductVersion) {
			if (data.ProductVersion.schematic && data.ProductVersion.schematic.length != 0) {
				canvas = document.getElementById('pdfCanvas') as HTMLCanvasElement;
				parentCanvas = document.getElementById('parentPdfCanvas') as HTMLDivElement;

				parentCanvas.addEventListener('mouseenter', () => {
					parentCanvas.addEventListener('mousemove', pan);
					parentCanvas.addEventListener('wheel', scalePdf);
				});

				parentCanvas.addEventListener('mouseleave', () => {
					parentCanvas.removeEventListener('mousemove', pan);
					parentCanvas.removeEventListener('wheel', scalePdf);
				});

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

			if (data.ProductVersion.picture) {
				//we have an image

				if (Array.isArray(data.ProductVersion.picture)) {
					//we have an array of images
					data.ProductVersion.picture.forEach((pic) => {
						addImageElement(pic, productImageElem);
					});
				} else {
					//we have only one image as string
					const imgSrc = data.ProductVersion.picture as string;
					if (imgSrc.length != 0) {
						addImageElement(imgSrc, productImageElem);
					}
				}
			}

			if (data.ProductVersion.video && data.ProductVersion.video.length != 0) {
				productVideoElem.src = data.ProductVersion.video;
			} else {
				productVideoElem.classList.add('hidden');
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

		siema = new Siema({ perPage: 1, loop: true });

		function createSiemaInterval() {
			siemaInterval = setInterval(() => {
				siema.next();
			}, 3000);
		}
		createSiemaInterval();

		productImageElem.addEventListener('mouseenter', () => {
			clearInterval(siemaInterval);
		});

		productImageElem.addEventListener('touchstart', () => {
			clearInterval(siemaInterval);
		});

		productImageElem.addEventListener('touchend', () => {
			createSiemaInterval();
		});

		productImageElem.addEventListener('mouseleave', () => {
			createSiemaInterval();
		});
	});
</script>

{@html data?.HtmlPage}
