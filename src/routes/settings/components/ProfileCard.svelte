<script lang="ts">
	import { Avatar } from '@skeletonlabs/skeleton-svelte';
	import { toaster } from '$lib/stores/toaster';
	import { avatarUrl as avatarStore } from '$lib/stores/avatar';
	import { STORAGE_KEYS } from '$lib/constants';

	export let displayName: string;
	export let bio: string;
	export let pronouns: string;
	export let imageUrl: string | null = null;
	export let onAvatarChange: ((newUrl: string | null) => void) | undefined = undefined;

	const BIO_MAX_LENGTH = 100;
	const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
	const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

	let isUploading = false;
	let fileInput: HTMLInputElement;

	$: initials =
		displayName
			?.split(' ')
			.map((n) => n[0])
			.join('')
			.slice(0, 2)
			.toUpperCase() || '?';

	$: displayBio =
		bio && bio.length > 0
			? bio.length > BIO_MAX_LENGTH
				? bio.slice(0, BIO_MAX_LENGTH) + '...'
				: bio
			: "Hey, I'm...";

	function handleUploadClick() {
		fileInput?.click();
	}

	interface AvatarUploadResponse {
		success: boolean;
		imageUrl: string;
	}

	async function handleFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];

		if (!file) return;

		// Client-side validation
		if (!ALLOWED_TYPES.includes(file.type)) {
			toaster.error({
				title: 'Invalid file type',
				description: 'Please select a JPEG, PNG, WebP, or GIF image.'
			});
			return;
		}

		if (file.size > MAX_FILE_SIZE) {
			toaster.error({
				title: 'File too large',
				description: 'Maximum file size is 5MB.'
			});
			return;
		}

		isUploading = true;

		try {
			const formData = new FormData();
			formData.append('avatar', file);

			const response = await fetch('/api/user/avatar', {
				method: 'POST',
				credentials: 'include',
				body: formData
			});

			if (!response.ok) {
				const errorData = (await response.json().catch(() => ({}))) as { message?: string };
				throw new Error(errorData.message || 'Upload failed');
			}

			const result = (await response.json()) as AvatarUploadResponse;

			sessionStorage.removeItem(STORAGE_KEYS.SETTINGS_CACHE);
			avatarStore.set(result.imageUrl);

			onAvatarChange?.(result.imageUrl);

			toaster.success({
				title: 'Avatar updated',
				description: 'Your profile picture has been updated.'
			});
		} catch (error) {
			console.error('Avatar upload failed:', error);
			toaster.error({
				title: 'Upload failed',
				description: error instanceof Error ? error.message : 'Could not upload avatar.'
			});
		} finally {
			isUploading = false;
			// Reset input to allow re-selecting same file
			input.value = '';
		}
	}
</script>

<div class="flex justify-center w-full">
	<div class="card p-6 flex flex-col md:flex-row items-center gap-4 w-full max-w-md">
		<div class="relative flex-shrink-0">
			<Avatar class="h-20 w-20">
				{#if imageUrl}
					<Avatar.Image src={imageUrl} alt="User avatar" />
				{/if}
				<Avatar.Fallback
					class="bg-primary-500 text-white font-bold text-xl flex items-center justify-center"
				>
					{initials}
				</Avatar.Fallback>
			</Avatar>

			<!-- Hidden file input -->
			<input
				bind:this={fileInput}
				type="file"
				accept="image/jpeg,image/png,image/webp,image/gif"
				class="hidden"
				on:change={handleFileSelect}
				disabled={isUploading}
			/>

			<!-- Upload button -->
			<button
				type="button"
				on:click={handleUploadClick}
				disabled={isUploading}
				class="absolute left-1/2 bottom-0 z-10 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-green-800 text-white cursor-pointer hover:bg-green-900 -translate-x-1/2 translate-y-1/2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{isUploading ? 'Uploading...' : 'Upload'}
			</button>
		</div>

		<div class="flex-1 min-w-0 mt-4 md:mt-0">
			<h3 class="font-semibold text-2xl">{displayName || 'Your name'}</h3>
			<p class="text-sm opacity-80 mt-1 break-words" title={bio}>
				{displayBio}
			</p>
			{#if pronouns}
				<p class="text-xs opacity-60 mt-1">{pronouns}</p>
			{/if}
		</div>
	</div>
</div>
