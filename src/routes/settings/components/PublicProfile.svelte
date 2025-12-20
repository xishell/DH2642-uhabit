<script lang="ts">
	import ProfileCard from './ProfileCard.svelte';
	import FieldWrapper from './FieldWrapper.svelte';
	import { settingsChanges } from '$lib/stores/settingsChanges';

	interface Props {
		displayName: string;
		bio: string;
		pronouns: string;
		onFieldChange?: (field: string, value: unknown) => void;
	}

	let { displayName, bio, pronouns, onFieldChange }: Props = $props();

	let draftName = $state(displayName);
	let draftBio = $state(bio);
	let draftPronouns = $state(pronouns);

	// Sync draft values when props change (e.g., on discard)
	$effect(() => {
		draftName = displayName;
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
		settingsChanges.setField('displayName', displayName, value);
		onFieldChange?.('displayName', value);
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
			<FieldWrapper field="displayName" label="Display name">
				<input
					id="displayName"
					class="input w-full border border-surface-300 dark:border-surface-600"
					value={draftName}
					oninput={handleNameChange}
					maxlength={20}
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

		<ProfileCard displayName={draftName} bio={draftBio} pronouns={draftPronouns} />
	</div>
</section>
