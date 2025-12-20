<script lang="ts">
	import { settingsChanges } from '$lib/stores/settingsChanges';
	import FieldWrapper from './FieldWrapper.svelte';

	interface Props {
		desktopNotifications: boolean;
		onFieldChange?: (field: string, value: unknown) => void;
	}

	let { desktopNotifications, onFieldChange }: Props = $props();

	let draftNotifications = $state(desktopNotifications);

	// Sync draft values when props change (e.g., on discard)
	$effect(() => {
		draftNotifications = desktopNotifications;
	});

	function handleChange(event: Event) {
		const value = (event.target as HTMLInputElement).checked;
		draftNotifications = value;
		settingsChanges.setField('notifications', desktopNotifications, value);
		onFieldChange?.('notifications', value);
	}
</script>

<section class="space-y-6">
	<h1 class="text-2xl font-bold">Notifications</h1>

	<div class="card p-6">
		<FieldWrapper field="notifications" label="Desktop notifications">
			<label class="flex items-center gap-3 cursor-pointer">
				<input
					type="checkbox"
					id="notifications"
					class="checkbox"
					checked={draftNotifications}
					onchange={handleChange}
				/>
				<span>Enable desktop push notifications</span>
			</label>
		</FieldWrapper>
	</div>
</section>
