<script lang="ts">
	import { Progress } from '@skeletonlabs/skeleton-svelte';
	import { Plus, Minus } from 'lucide-svelte';
	import type { HabitWithStatus } from '$lib/types/habit';

	export let selectedProgressive: HabitWithStatus;

	export let onSave: (data: HabitWithStatus) => void = () => {};
	export let onClose: () => void = () => {};

	let progress = selectedProgressive.progress;

	function increment() {
		const target = selectedProgressive.habit.targetAmount ?? 0;
		if (progress < target) progress += 1;
	}

	function decrement() {
		if (progress > 0) progress -= 1;
	}

	function save() {
		onSave?.({ ...selectedProgressive, progress });
	}

	function close() {
		onClose?.();
	}
</script>

<div class="fixed inset-0 bg-black/30 flex items-end md:items-center justify-center z-50">
	<div class="bg-white w-full md:w-96 rounded-t-xl md:rounded-xl p-6 md:p-8">
		<div class="flex justify-between items-center mb-4">
			<div class="font-semibold text-lg">{selectedProgressive.habit.title}</div>
			<button
				on:click={close}
				class="text-surface-500 hover:text-surface-700 text-xl font-bold"
				aria-label="Close">&times;</button
			>
		</div>

		<div class="flex flex-col items-center gap-4">
			<!-- Progress Circle -->
			<Progress value={progress} max={selectedProgressive.habit.targetAmount ?? 0}>
				<Progress.Label />
				<Progress.Circle>
					<Progress.CircleTrack />
					<Progress.CircleRange />
				</Progress.Circle>
				<Progress.ValueText />
			</Progress>

			<!-- Increment / Decrement -->
			<div class="flex items-center gap-6 mt-4">
				<button
					on:click={decrement}
					class="p-2 rounded-lg border border-surface-300 hover:bg-surface-100 transition"
				>
					<Minus class="w-4 h-4" />
				</button>
				<button
					on:click={increment}
					class="p-2 rounded-lg border border-surface-300 hover:bg-surface-100 transition"
				>
					<Plus class="w-4 h-4" />
				</button>
			</div>

			<!-- Save / Complete Button -->
			<button
				on:click={save}
				class="w-full mt-4 py-2 rounded-lg bg-violet-600 text-white font-medium hover:bg-violet-700 transition"
			>
				Complete
			</button>
		</div>
	</div>
</div>
