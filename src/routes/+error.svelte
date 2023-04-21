<script lang="ts">
	import PageNotFoundImg from '$lib/images/page_not_found.svg';
</script>

<svelte:head>
	<title>Product not found | Robots Mobots</title>
	<meta name="description" content="Robots Mobots - Error" />
</svelte:head>

<div class="error_container">
	<div class="error_container1">
		<img src={PageNotFoundImg} alt="page not found" />
		<p class="paragraphStyle">
			The page you are searching for is not currently available.
		</p>
	</div>
</div>
