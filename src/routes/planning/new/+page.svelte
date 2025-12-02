<script>
	import { DatePicker, Portal } from '@skeletonlabs/skeleton';

	// let value;
</script>

<div class="add-habit-view w-full flex flex-col gap-7 p-7 max-w-[800px] m-auto">
	<h1 class="hidden sm:block text-center text-xl">New Habit</h1>
	<div
		class="form-info grid grid-cols-1 sm:grid-cols-2 sm:border sm:border-gray-300 sm:rounded-[10px] sm:py-[50px] sm:px-[50px]"
	>
		<div class="basic-info flex flex-col gap-2.5 sm:pr-[40px] sm:border-r-gray-300 sm:border-r">
			<span>Title</span>
			<input
				type="text"
				class="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
			/>

			<span>Notes</span>
			<textarea
				class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm
         focus:outline-none focus:ring-2 focus:ring-blue-500"
				rows="4"
				placeholder="write down your notes for this habit..."
			></textarea>

			<span>Color</span>
			<div class="color-picking-sec w-full h-16 bg-gray-200 rounded-md"></div>
		</div>
		<div class="additional-info flex flex-col gap-2.5 sm:pl-[40px]">
			<span>Frequency</span>
			<input
				type="text"
				class="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
			/>
			<span>Measurement</span>
			<input
				type="text"
				class="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
			/>
			<span>Period(optional)</span>
			<input
				type="text"
				class="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
			/>
		</div>
	</div>
	<div class="form-btn flex justify-center gap-6">
		<button
			class="text-sm bg-gray-100 rounded-[50px] py-2 px-4 hover:bg-gray-300 transition-colors duration-300 cursor-pointer shadow-md"
		>
			Cancel
		</button>
		<button
			class="text-sm bg-gray-100 rounded-[50px] py-2 px-4 hover:bg-gray-300 transition-colors duration-300 cursor-pointer shadow-md"
		>
			Create
		</button>
	</div>
</div>

<!-- <div class="flex flex-col items-center gap-4">
	<SegmentedControl {value} onValueChange={(details) => (value = details.value)}>
		<SegmentedControl.Label>Browse</SegmentedControl.Label>
		<SegmentedControl.Control>
			<SegmentedControl.Indicator />
			<SegmentedControl.Item value="music">
				<SegmentedControl.ItemText>Music</SegmentedControl.ItemText>
				<SegmentedControl.ItemHiddenInput />
			</SegmentedControl.Item>
			<SegmentedControl.Item value="images">
				<SegmentedControl.ItemText>Images</SegmentedControl.ItemText>
				<SegmentedControl.ItemHiddenInput />
			</SegmentedControl.Item>
			<SegmentedControl.Item value="videos">
				<SegmentedControl.ItemText>Videos</SegmentedControl.ItemText>
				<SegmentedControl.ItemHiddenInput />
			</SegmentedControl.Item>
		</SegmentedControl.Control>
	</SegmentedControl>

	<p><span class="opacity-60">You selected</span> <code class="code">{value}</code></p>
</div> -->
