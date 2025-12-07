<script lang="ts">
	import SelectWeekDay from '$lib/components/SelectWeekDay.svelte';
	import SelectMonthDay from '$lib/components/SelectMonthDay.svelte';
	import SelectOrEdit from '$lib/components/SelectOrEdit.svelte';
	import { fade } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { routes } from '$lib/routes';
	export let form;

	$: type = $page.url.searchParams.get('type');

	const colors = ['#E0E0E0', '#CCCCCC', '#B8B8B8', '#A4A4A4', '#909090', '#7C7C7C', '#686868'];
	const frequencyArr = ['daily', 'weekly', 'monthly'];

	$: measurement = type === 'progressive' ? 'numeric' : 'boolean';
	let selectedColor: string = colors[2];
	let selectedFrequency: string = frequencyArr[0];
	let unit: string = 'ml';

	function selectColor(color: string) {
		selectedColor = color;
		console.log(color);
	}
</script>

<form method="POST">
	<div class="add-habit-view w-full flex flex-col gap-12 p-7 max-w-[800px] m-auto">
		<h1 class="hidden sm:block text-center text-xl">New Habit</h1>
		{#if form?.error}
			<p class="text-red-600 text-sm text-center">{form.error}</p>
		{/if}
		<!-- form body -->
		<div
			class="form-info grid grid-cols-1 gap-3 sm:gap-0 sm:grid-cols-2 sm:border sm:border-gray-300 sm:rounded-[10px] sm:py-[50px] sm:px-[50px]"
		>
			<div class="basic-info flex flex-col gap-3 sm:pr-[40px] sm:border-r-gray-300 sm:border-r">
				<span>Title</span>
				<input
					type="text"
					class=" border border-gray-300 rounded-md px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
					placeholder="e.g. drink water"
					name="title"
				/>

				<span>Notes</span>
				<textarea
					class="w-full rounded-md border border-gray-300 px-2 py-2 text-sm
         focus:outline-none focus:ring-2 focus:ring-blue-500"
					rows="4"
					placeholder="write down your notes for this habit..."
					name="notes"
				></textarea>

				<span>Color</span>
				<div class="color-picking-sec w-full h-10 rounded-md flex justify-between items-center">
					{#each colors as color}
						<button
							type="button"
							class="color-dot w-10 h-10 sm:w-9 sm:h-9 rounded-full border-2 p-[0.1rem] bg-clip-content transition-all duration-200"
							style="background-color: {color};"
							on:click={() => selectColor(color)}
							style:border-color={selectedColor === color ? selectedColor : 'transparent'}
							aria-label={`Select color ${color}`}
						></button>
					{/each}
				</div>
				<input type="hidden" name="color" value={selectedColor} />
			</div>

			<div class="additional-info flex flex-col gap-3 sm:pl-[40px]">
				<span>Frequency</span>
				<div class="flex flex-col gap-2.5">
					<div class="w-full h-10 rounded-md flex justify-between items-center">
						{#each frequencyArr as frequency}
							<button
								type="button"
								class="btn capitalize preset-outlined-surface-500 border-primary-600 transition-colors duration-200 sm:text-sm"
								class:border-transparent={!(selectedFrequency === frequency)}
								class:text-primary-700={selectedFrequency === frequency}
								on:click={() => (selectedFrequency = frequency)}
							>
								{frequency}
							</button>
						{/each}
					</div>
					{#if selectedFrequency === 'weekly'}
						<SelectWeekDay />
					{:else if selectedFrequency === 'monthly'}
						<SelectMonthDay />
					{:else}{/if}
				</div>
				<input type="hidden" name="frequency" value={selectedFrequency} />

				{#if measurement === 'numeric'}
					<span>Measurement</span>
					<div class="inputs-ctn flex gap-4">
						<input
							type="text"
							class="border border-gray-300 w-18 h-9 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-right pr-2"
							placeholder="100"
							name="targetAmount"
						/>
						<SelectOrEdit />
					</div>
				{/if}
				<input type="hidden" name="measurement" value={measurement} />

				<!-- future development [Goal] -->
				<!-- <span>Period(optional)</span>
			<input
				type="text"
				class="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
			/> -->
			</div>
		</div>

		<!-- confirmation btns -->
		<div class="form-btn flex justify-center gap-8">
			<button
				type="button"
				class="text-sm w-24 bg-gray-100 rounded-[50px] py-3 px-6 hover:bg-gray-300 transition-colors duration-300 cursor-pointer shadow-sm"
				on:click={() => goto(routes.habits.list)}
			>
				Cancel
			</button>
			<button
				type="submit"
				class="text-md w-24 bg-gray-100 rounded-[50px] py-2 px-5 hover:bg-gray-300 transition-colors duration-300 cursor-pointer shadow-sm"
			>
				Create
			</button>
		</div>
	</div>
</form>
