<script lang="ts">
	import ProfileCard from './ProfileCard.svelte';

	export let displayName: string;
	export let bio: string;
	export let pronouns: string;

	export let onSave: (payload: {
		displayName: string;
		bio: string;
		pronouns: string;
	}) => void;

	// Draft state (editable)
	let draftName = displayName;
	let draftBio = bio;
	let draftPronouns = pronouns;

	function save() {
		onSave({
			displayName: draftName,
			bio: draftBio,
			pronouns: draftPronouns
		});
	}
</script>

<section class="space-y-6">
	<h1 class="text-2xl font-bold">Profile</h1>

	<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
		<!-- FORM -->
		<div class="card p-6 space-y-4">
			<div>
				<label for="displayName" class="label">Display name</label>
				<input
					id="displayName"
					class="input w-full border border-indigo-600	"
					bind:value={draftName}
				/>
			</div>

			<div>
				<label for="bio" class="label">Bio</label>
				<textarea
					id="bio"
					class="textarea w-full border border-indigo-600"
					bind:value={draftBio}
				></textarea>
			</div>

			<div>
				<label for="pronouns" class="label">Pronouns</label>
				<select
					id="pronouns"
					class="select w-full px-2 py-2 rounded border border-indigo-600 text-sm"
					bind:value={draftPronouns}
				>
					<option value="she/her">she/her</option>
					<option value="he/him">he/him</option>
					<option value="they/them">they/them</option>
				</select>
			</div>

			<button
				class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
				on:click={save}
			>
				Save
			</button>
		</div>

		<!-- PREVIEW (saved state only) -->
		<ProfileCard
			displayName={displayName}
			bio={bio}
			pronouns={pronouns}
		/>
	</div>
</section>
