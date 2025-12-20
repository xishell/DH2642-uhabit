<script lang="ts">
	import { themeMode as themeStore, type ThemeMode } from '$lib/stores/theme';
	import { settingsChanges } from '$lib/stores/settingsChanges';
	import FieldWrapper from './FieldWrapper.svelte';

	interface Props {
		currentTheme: ThemeMode;
		accentColor: string;
		typography: string;
		onFieldChange?: (field: string, value: unknown) => void;
	}

	let { currentTheme, accentColor, typography, onFieldChange }: Props = $props();

	let draftTheme = $state(currentTheme);
	let draftAccentColor = $state(accentColor);
	let draftTypography = $state(typography);

	// Sync draft values when props change (e.g., on discard)
	$effect(() => {
		draftTheme = currentTheme;
	});

	$effect(() => {
		draftAccentColor = accentColor;
	});

	$effect(() => {
		draftTypography = typography;
	});

	function handleThemeChange(event: Event) {
		const select = event.target as HTMLSelectElement;
		const newMode = select.value as ThemeMode;
		draftTheme = newMode;
		// Apply theme immediately for visual feedback
		themeStore.set(newMode);
		settingsChanges.setField('theme', currentTheme, newMode);
		onFieldChange?.('theme', newMode);
	}

	function handleAccentColorChange(event: Event) {
		const value = (event.target as HTMLSelectElement).value;
		draftAccentColor = value;
		settingsChanges.setField('accentColor', accentColor, value);
		onFieldChange?.('accentColor', value);
	}

	function handleTypographyChange(event: Event) {
		const value = (event.target as HTMLSelectElement).value;
		draftTypography = value;
		settingsChanges.setField('typography', typography, value);
		onFieldChange?.('typography', value);
	}
</script>

<section class="space-y-6">
	<h1 class="text-2xl font-bold">Preferences</h1>

	<div class="card p-6 space-y-4">
		<FieldWrapper field="theme" label="Appearance (theme)">
			<select
				id="theme"
				class="select w-full px-3 py-2 rounded border border-surface-300 dark:border-surface-600 bg-surface-50 dark:bg-surface-800 text-sm"
				value={draftTheme}
				onchange={handleThemeChange}
			>
				<option value="system">System</option>
				<option value="light">Light</option>
				<option value="dark">Dark</option>
			</select>
		</FieldWrapper>

		<FieldWrapper field="accentColor" label="Accent color">
			<select
				id="accentColor"
				class="select w-full px-3 py-2 rounded border border-surface-300 dark:border-surface-600 bg-surface-50 dark:bg-surface-800 text-sm"
				value={draftAccentColor}
				onchange={handleAccentColorChange}
			>
				<option value="indigo">Indigo</option>
				<option value="emerald">Emerald</option>
				<option value="rose">Rose</option>
			</select>
		</FieldWrapper>

		<FieldWrapper field="typography" label="Typography">
			<select
				id="typography"
				class="select w-full px-3 py-2 rounded border border-surface-300 dark:border-surface-600 bg-surface-50 dark:bg-surface-800 text-sm"
				value={draftTypography}
				onchange={handleTypographyChange}
			>
				<option value="sans">Sans</option>
				<option value="serif">Serif</option>
				<option value="mono">Mono</option>
			</select>
		</FieldWrapper>
	</div>
</section>
