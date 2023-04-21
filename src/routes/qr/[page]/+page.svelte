<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	export let data: ProductRequest | null;

	onMount(() => {
		if (data != null && data.Product != null) {
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

			descriptionContentElem.innerHTML = data.ProductVersion.description;

			usageContentElem.innerHTML = ''; //currently not used
			downloadUserManualLinkElem.href = data.ProductVersion.user_manual;
			downloadSchematicLinkElem.href = data.ProductVersion.schamatic;
			tutorialLinkElem.href = data.ProductVersion.tutorial;
			githubLinkElem.href = data.ProductVersion.github;
			// productImageElem.src = data.ProductVersion.picture;
		}
	});
</script>

{@html data?.HtmlPage}
