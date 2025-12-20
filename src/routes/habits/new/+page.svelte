<script lang="ts">
	import SelectWeekDay from '$lib/components/SelectWeekDay.svelte';
	import SelectMonthDay from '$lib/components/SelectMonthDay.svelte';
	import SelectOrEdit from '$lib/components/SelectOrEdit.svelte';
	import { routes } from '$lib/routes';

	let { form }: { form: any } = $props();

	const colors = ['#E0E0E0', '#CCCCCC', '#B8B8B8', '#A4A4A4', '#909090', '#7C7C7C', '#686868'];
	const frequencyArr = ['daily', 'weekly', 'monthly'];

	let selectedColor = $state<string>(colors[2]);
	let selectedFrequency = $state<string>(frequencyArr[0]);
	let unit = $state<string>('');

	function selectColor(color: string) {
		selectedColor = color;
		console.log(color);
	}
</script>

<form method="POST">
	<div class="add-habit-view w-full flex flex-col gap-12 p-7 max-w-[800px] m-auto">
		<h1 class="hidden sm:block text-center text-xl">New Habit</h1>
		{#if form?.error}
			<p class="text-error-600 text-sm text-center">{form.error}</p>
		{/if}
		<!-- form body -->
		<div
			class="form-info grid grid-cols-1 gap-3 sm:gap-0 sm:grid-cols-2 sm:border sm:border-surface-300 dark:sm:border-surface-600 sm:rounded-xl sm:py-[50px] sm:px-[50px]"
		>
			<div
				class="basic-info flex flex-col gap-3 sm:pr-[40px] sm:border-r-surface-300 dark:sm:border-r-surface-600 sm:border-r"
			>
				<span>Title <span class="text-error-500">*</span></span>
				<input
					type="text"
					class="border border-surface-300-600 rounded-md px-2 py-2 text-sm bg-surface-50-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
					placeholder="e.g. drink water"
					name="title"
					required
				/>

				<span>Notes</span>
				<textarea
					class="w-full rounded-md border border-surface-300-600 px-2 py-2 text-sm bg-surface-50-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
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
							onclick={() => selectColor(color)}
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
								onclick={() => (selectedFrequency = frequency)}
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

				<span>Target <span class="text-surface-400">(optional)</span></span>
				<p class="text-xs text-surface-500 -mt-1">Set a target amount to track progress</p>
				<div class="inputs-ctn flex gap-4">
					<input
						type="number"
						class="border border-surface-300-600 w-28 h-11 rounded-md text-base px-3 bg-surface-50-900 focus:outline-none focus:ring-2 focus:ring-primary-500 text-right"
						placeholder="100"
						name="targetAmount"
						min="1"
					/>
					<SelectOrEdit />
				</div>

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
			<a
				href={routes.habits.list}
				data-sveltekit-preload-data="hover"
				class="text-sm w-24 bg-secondary-200 dark:bg-secondary-800 text-secondary-800 dark:text-secondary-200 rounded-full py-3 px-6 hover:bg-secondary-300 dark:hover:bg-secondary-700 transition-colors duration-200 cursor-pointer shadow-sm text-center"
			>
				Cancel
			</a>
			<button
				type="submit"
				class="text-sm w-24 bg-primary-200-800 text-primary-800-200 rounded-full py-3 px-6 hover:bg-primary-400-600 transition-colors duration-200 cursor-pointer shadow-sm"
			>
				Create
			</button>
		</div>
	</div>
</form>
