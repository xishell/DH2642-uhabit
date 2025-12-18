<script lang="ts">
	export let displayName: string = '';
	export let bio: string = '';
	export let pronouns: string = 'they/them';

	// Callback prop
	export let onSave: (payload: { displayName: string; bio: string; pronouns: string }) => void;

	function save() {
		onSave({ displayName, bio, pronouns });
	}
</script>

<section class="space-y-6">
	<h1 class="text-2xl font-bold">Public profile</h1>

	<div class="card p-6 space-y-4">
		<label for="display-name" class="label">Display name</label>
		<input
			id="display-name"
			class="input w-full"
			placeholder="First + Last name"
			bind:value={displayName}
		/>

		<label for="bio" class="label">Bio</label>
		<textarea id="bio" class="textarea w-full" placeholder="Tell us about you!!" bind:value={bio}
		></textarea>

		<label for="pronouns" class="label">Pronouns</label>
		<select id="pronouns" class="select w-full" bind:value={pronouns}>
			<option value="she/her">she/her</option>
			<option value="he/him">he/him</option>
			<option value="they/them">they/them</option>
		</select>

		<button
			class="px-4 py-2 rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
			on:click={save}
		>
			Save
		</button>
	</div>
</section>
