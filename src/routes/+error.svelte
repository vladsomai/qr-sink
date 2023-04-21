<script lang="ts">
	import PageNotFoundImg from '$lib/images/page_not_found.svg';
</script>

<svelte:head>
	<title>Product not found | Robots Mobots</title>
	<meta name="description" content="Robots Mobots - Error" />
</svelte:head>

<div class="w-screen h-screen flex justify-center items-center">
	<div class="w-full mx-[10%] sm:w-[40%] xl:w-[30%] flex justify-center items-center flex-col">
		<img src={PageNotFoundImg} alt="page not found" />
		<p class="text-2xl sm:text-3xl mt-5 text-center">
			The page you are searching for is not currently available.
		</p>
	</div>
</div>
