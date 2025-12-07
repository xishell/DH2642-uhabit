<script>
	export let content = 'button';
	export let variant: 'filled' | 'tonal' | 'outlined' = 'tonal';
	export let color: 'primary' | 'secondary' | 'tertiary' | 'surface' | 'error' = 'surface';

	const presets = {
		filled: {
			primary: 'preset-filled-primary-500',
			secondary: 'preset-filled-secondary-500',
			tertiary: 'preset-filled-tertiary-500',
			surface: 'preset-filled-surface-400-600',
			error: 'preset-filled-error-500'
		},
		tonal: {
			primary: 'preset-tonal-primary',
			secondary: 'preset-tonal-secondary',
			tertiary: 'preset-tonal-tertiary',
			surface: 'preset-tonal-surface',
			error: 'preset-tonal-error'
		},
		outlined: {
			primary: 'preset-outlined-primary-500',
			secondary: 'preset-outlined-secondary-500',
			tertiary: 'preset-outlined-tertiary-500',
			surface: 'preset-outlined-surface-500',
			error: 'preset-outlined-error-500'
		}
	};

	$: presetClass = presets[variant][color];
</script>

<button class="btn {presetClass}">{content}</button>
