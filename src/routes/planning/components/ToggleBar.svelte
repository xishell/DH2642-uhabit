<script>
	let habitType = 0; //0 for progressive habit, 1 for single-step habit
	let isPActive = true;
	let isSActive = false;
	const activateP = () => {
		isPActive = true;
		isSActive = false;
		habitType = 0;
	};

	const activateS = () => {
		isPActive = false;
		isSActive = true;
		habitType = 1;
	};
</script>

<div class="text-[14px] p-[5px] rounded-[40px] bg-gray-100 flex justify-between gap-2">
	<button
		class="py-1 px-3 rounded-[40px] hover:bg-gray-300 transition-[1s] cursor-pointer"
		class:bg-gray-300={isPActive}
		on:click={activateP}
		>Progressive
	</button>
	<button
		class="py-1 px-3 rounded-[40px] hover:bg-gray-300 transition-[1s] cursor-pointer"
		class:bg-gray-300={isSActive}
		on:click={activateS}>Single-Step</button
	>
</div>
