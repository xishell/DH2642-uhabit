<script lang="ts">
	// Props for current preferences
	export let themeMode: 'light' | 'dark' = 'light';
	export let accentColor: string = 'indigo';
	export let typography: string = 'sans';

	// Callback to parent when preferences are saved
	export let onSave: (payload: {
		themeMode: 'light' | 'dark';
		accentColor: string;
		typography: string;
	}) => void;

	function save() {
		onSave({ themeMode, accentColor, typography });
	}
</script>

<section class="space-y-6">
	<h1 class="text-2xl font-bold">Preferences</h1>

	<div class="card p-6 space-y-4">
		<!-- Appearance / Theme -->
		<div>
			<label for="theme-mode" class="label">Appearance (theme)</label>
			<select
				id="theme-mode"
				class="select w-full px-3 py-2 rounded border border-primary-500 text-sm"
				bind:value={themeMode}
			>
				<option value="light">Light</option>
				<option value="dark">Dark</option>
			</select>
		</div>

		<!-- Accent color -->
		<div>
			<label for="accent-color" class="label">Accent color</label>
			<select
				id="accent-color"
				class="select w-full px-3 py-2 rounded border border-primary-500 text-sm"
				bind:value={accentColor}
			>
				<option value="indigo">Indigo</option>
				<option value="emerald">Emerald</option>
				<option value="rose">Rose</option>
			</select>
		</div>

		<!-- Typography -->
		<div>
			<label for="typography" class="label">Typography</label>
			<select
				id="typography"
				class="select w-full px-3 py-2 rounded border border-primary-500 text-sm"
				bind:value={typography}
			>
				<option value="sans">Sans</option>
				<option value="serif">Serif</option>
				<option value="mono">Mono</option>
			</select>
		</div>

		<!-- Save button -->
		<button
			class="px-4 py-2 rounded-md text-white bg-primary-500 hover:bg-primary-600"
			on:click={save}
		>
			Save
		</button>
	</div>
</section>
