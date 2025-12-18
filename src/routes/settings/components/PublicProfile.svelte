<script lang="ts">
	import ProfileCard from './ProfileCard.svelte';

	export let displayName = '';
	export let bio = '';
	export let pronouns = 'they/them';

	export let onSave: (payload: {
		displayName: string;
		bio: string;
		pronouns: string;
	}) => void;

	function save() {
		onSave({ displayName, bio, pronouns });
	}
</script>

<section class="space-y-8">
	<h1 class="text-2xl font-bold">Public profile</h1>

	<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
		<!-- FORM -->
		<div class="card p-6 space-y-4">
			<div>
				<label for="displayName" class="label">Display name</label>
				<input id="displayName" class="input w-full" bind:value={displayName} />
			</div>

			<div>
				<label for="bio" class="label">Bio</label>
				<textarea id="bio" class="textarea w-full" bind:value={bio}></textarea>
			</div>

			<div>
				<label for="pronouns" class="label">Pronouns</label>
				<select id="pronouns" class="select w-full" bind:value={pronouns}>
					<option value="she/her">she/her</option>
					<option value="he/him">he/him</option>
					<option value="they/them">they/them</option>
				</select>
			</div>

			<button class="px-4 py-2 bg-indigo-600 text-white rounded-md" on:click={save}>
				Save
			</button>
		</div>

		<!-- PREVIEW -->
		<ProfileCard {displayName} {bio} {pronouns} />
	</div>
</section>
