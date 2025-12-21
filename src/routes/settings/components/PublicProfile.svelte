<script lang="ts">
	import { untrack } from 'svelte';
	import ProfileCard from './ProfileCard.svelte';
	import FieldWrapper from './FieldWrapper.svelte';
	import { settingsChanges } from '$lib/stores/settingsChanges';

	interface Props {
		name: string;
		bio: string;
		pronouns: string;
		imageUrl?: string | null;
		onFieldChange?: (field: string, value: unknown) => void;
		onAvatarChange?: (newUrl: string | null) => void;
	}

	let { name, bio, pronouns, imageUrl, onFieldChange, onAvatarChange }: Props = $props();

	let draftName = $state(untrack(() => name));
	let draftBio = $state(untrack(() => bio));
	let draftPronouns = $state(untrack(() => pronouns));

	// Sync draft values when props change (e.g., on discard)
	$effect(() => {
		draftName = name;
	});

	$effect(() => {
		draftBio = bio;
	});

	$effect(() => {
		draftPronouns = pronouns;
	});

	function handleNameChange(e: Event) {
		const value = (e.target as HTMLInputElement).value;
		draftName = value;
		settingsChanges.setField('name', name, value);
		onFieldChange?.('name', value);
	}

	function handleBioChange(e: Event) {
		const value = (e.target as HTMLTextAreaElement).value;
		draftBio = value;
		settingsChanges.setField('bio', bio, value);
		onFieldChange?.('bio', value);
	}

	function handlePronounsChange(e: Event) {
		const value = (e.target as HTMLSelectElement).value;
		draftPronouns = value;
		settingsChanges.setField('pronouns', pronouns, value);
		onFieldChange?.('pronouns', value);
	}
</script>

<section class="space-y-6">
	<h1 class="text-2xl font-bold">Profile</h1>

	<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
		<div class="card p-6 space-y-4">
			<FieldWrapper field="name" label="Display name">
				<input
					id="name"
					class="input w-full border border-surface-300 dark:border-surface-600"
					value={draftName}
					oninput={handleNameChange}
					maxlength={100}
				/>
			</FieldWrapper>

			<FieldWrapper field="bio" label="Bio">
				<textarea
					id="bio"
					class="textarea w-full border border-surface-300 dark:border-surface-600"
					value={draftBio}
					oninput={handleBioChange}
					maxlength={100}
				></textarea>
			</FieldWrapper>

			<FieldWrapper field="pronouns" label="Pronouns">
				<select
					id="pronouns"
					class="select w-full px-2 py-2 rounded border border-surface-300 dark:border-surface-600 bg-surface-50 dark:bg-surface-800 text-sm"
					value={draftPronouns}
					onchange={handlePronounsChange}
				>
					<option value="she/her">she/her</option>
					<option value="he/him">he/him</option>
					<option value="they/them">they/them</option>
				</select>
			</FieldWrapper>
		</div>

		<ProfileCard
			name={draftName}
			bio={draftBio}
			pronouns={draftPronouns}
			{imageUrl}
			{onAvatarChange}
		/>
	</div>
</section>
