<script lang="ts">
	// Props
	export let desktopNotifications: boolean = false;

	// Callback to parent when saving
	export let onSave: (payload: { desktop: boolean }) => void;

	function save() {
		onSave({ desktop: desktopNotifications });
	}
</script>

<section class="space-y-6">
	<h1 class="text-2xl font-bold">Notifications</h1>

	<div class="card p-6">
		<!-- Wrapping input in label is accessible for checkboxes -->
		<label class="flex items-center gap-3">
			<input type="checkbox" class="checkbox" bind:checked={desktopNotifications} />
			<span>Enable desktop push notifications</span>
		</label>

		<button
			class="px-4 py-2 rounded-md text-white bg-primary-500 hover:bg-primary-600 mt-4"
			on:click={save}
		>
			Save
		</button>
	</div>
</section>
