<script lang="ts">
	import { Check } from 'lucide-svelte';

	export let s: { id: string; title: string; done: boolean };
	export let onToggle: (id: string) => void;

	function toggleDone() {
		onToggle?.(s.id);
	}
</script>

<div
	class="bg-surface rounded-xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition"
>
	<div class="flex items-center gap-4 flex-1">
		<button
			type="button"
			on:click|stopPropagation={toggleDone}
			class="
                w-5 h-5 rounded-full flex items-center justify-center border-2
                transition
                border-surface-500
                hover:border-violet-600
                focus:outline-none focus:ring-2 focus:ring-violet-400
            "
			class:border-violet-600={s.done}
			class:bg-violet-600={s.done}
		>
			{#if s.done}
				<Check class="w-3 h-3 text-white" />
			{/if}
		</button>

		<div
			class="text-sm font-medium transition"
			class:line-through={s.done}
			class:text-surface-400={s.done}
		>
			{s.title}
		</div>
	</div>
</div>
