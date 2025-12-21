<script lang="ts">
	import { untrack } from 'svelte';
	import { themeMode as themeStore, type ThemeMode } from '$lib/stores/theme';
	import { reduceMotion as motionStore } from '$lib/stores/reduceMotion';
	import { userCountry } from '$lib/stores/country';
	import { settingsChanges } from '$lib/stores/settingsChanges';
	import { Switch } from '@skeletonlabs/skeleton-svelte';
	import FieldWrapper from './FieldWrapper.svelte';
	import { getCountryOptions } from '$lib/constants/countries';

	interface Props {
		currentTheme: ThemeMode;
		reduceMotion: boolean;
		country: string;
		accentColor: string;
		typography: string;
		onFieldChange?: (field: string, value: unknown) => void;
	}

	let { currentTheme, reduceMotion, country, accentColor, typography, onFieldChange }: Props =
		$props();

	const countryOptions = getCountryOptions();

	let draftTheme = $state(untrack(() => currentTheme));
	let draftReduceMotion = $state(untrack(() => reduceMotion));
	let draftCountry = $state(untrack(() => country));
	let draftAccentColor = $state(untrack(() => accentColor));
	let draftTypography = $state(untrack(() => typography));

	// Sync draft values when props change (e.g., on discard)
	$effect(() => {
		draftTheme = currentTheme;
	});

	$effect(() => {
		draftReduceMotion = reduceMotion;
	});

	$effect(() => {
		draftCountry = country;
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

	function handleReduceMotionChange(checked: boolean) {
		draftReduceMotion = checked;
		motionStore.set(checked);
		onFieldChange?.('reduceMotion', checked);
	}

	function handleCountryChange(event: Event) {
		const value = (event.target as HTMLSelectElement).value;
		draftCountry = value;
		// Apply immediately for visual feedback
		userCountry.set(value || null);
		settingsChanges.setField('country', country, value);
		onFieldChange?.('country', value);
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

		<div class="flex items-center justify-between">
			<div>
				<p class="font-medium">Reduce motion</p>
				<p class="text-sm text-surface-500 dark:text-surface-400">
					Disable page transition animations
				</p>
			</div>
			<Switch
				name="reduceMotion"
				checked={draftReduceMotion}
				onCheckedChange={(e) => handleReduceMotionChange(e.checked)}
			>
				<Switch.Control>
					<Switch.Thumb />
				</Switch.Control>
				<Switch.HiddenInput />
			</Switch>
		</div>

		<FieldWrapper field="country" label="Country / Region">
			<p class="text-sm text-surface-500 dark:text-surface-400 mb-2">
				Used for date formatting and public holiday suggestions
			</p>
			<select
				id="country"
				class="select w-full px-3 py-2 rounded border border-surface-300 dark:border-surface-600 bg-surface-50 dark:bg-surface-800 text-sm"
				value={draftCountry}
				onchange={handleCountryChange}
			>
				<option value="">Select a country</option>
				{#each countryOptions as { code, name }}
					<option value={code}>{name}</option>
				{/each}
			</select>
		</FieldWrapper>

		<div class="opacity-50">
			<div class="flex items-center gap-2 mb-1">
				<label for="accentColor" class="text-sm font-medium">Accent color</label>
				<span
					class="text-xs px-2 py-0.5 rounded-full bg-surface-200 dark:bg-surface-700 text-surface-500 dark:text-surface-400"
				>
					Coming soon
				</span>
			</div>
			<select
				id="accentColor"
				disabled
				class="select w-full px-3 py-2 rounded border border-surface-300 dark:border-surface-600 bg-surface-50 dark:bg-surface-800 text-sm cursor-not-allowed"
				value={draftAccentColor}
			>
				<option value="indigo">Indigo</option>
				<option value="emerald">Emerald</option>
				<option value="rose">Rose</option>
			</select>
		</div>

		<div class="opacity-50">
			<div class="flex items-center gap-2 mb-1">
				<label for="typography" class="text-sm font-medium">Typography</label>
				<span
					class="text-xs px-2 py-0.5 rounded-full bg-surface-200 dark:bg-surface-700 text-surface-500 dark:text-surface-400"
				>
					Coming soon
				</span>
			</div>
			<select
				id="typography"
				disabled
				class="select w-full px-3 py-2 rounded border border-surface-300 dark:border-surface-600 bg-surface-50 dark:bg-surface-800 text-sm cursor-not-allowed"
				value={draftTypography}
			>
				<option value="sans">Sans</option>
				<option value="serif">Serif</option>
				<option value="mono">Mono</option>
			</select>
		</div>
	</div>
</section>
