<script lang="ts">
	import { downloadIcon, type ProductRequest } from '$lib/types';
	import { onMount } from 'svelte';
	import Siema from 'siema';

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

	let pdfFrame: HTMLIFrameElement;

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
		const productImageElem = document.getElementById('product-image') as HTMLDivElement;
		const productVideoElem = document.getElementById('product-video') as HTMLIFrameElement;

		productContentElem.innerHTML = data.Product.Product;

		if (data.ProductVersion) {
			if (data.ProductVersion.schematic && data.ProductVersion.schematic.length != 0) {
				pdfFrame = document.getElementById('pdfCanvas') as HTMLIFrameElement;

				downloadSchematicLinkElem.href = data.ProductVersion.schematic;
				pdfFrame.src =
					'https://docs.google.com/gview?url=' + data.ProductVersion.schematic + '&embedded=true';
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
                console.log(firmwareTableBody)

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
