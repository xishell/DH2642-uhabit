<script lang="ts">
	let { quote, author, loading }: { quote: string; author: string; loading: boolean } = $props();
</script>

<div
	class="motivation-card w-full h-40 text-[20px] text-center flex justify-center items-center px-[30px] mt-[45px] mb-[30px] bg-primary-500 text-white opacity-80 rounded-xl"
>
	{#if loading}
		<div class="w-full max-w-[560px] space-y-3 animate-pulse">
			<div class="h-5 w-4/5 mx-auto rounded-full bg-surface-50/25"></div>
			<div class="h-5 w-11/12 mx-auto rounded-full bg-surface-50/15"></div>
			<div class="h-4 w-1/3 mx-auto rounded-full bg-surface-50/20"></div>
		</div>
	{:else}
		<p class="leading-snug">
			"{quote}"
			{#if author}
				<br />
				<span class="text-sm opacity-80">— {author}</span>
			{/if}
		</p>
	{/if}
</div>
