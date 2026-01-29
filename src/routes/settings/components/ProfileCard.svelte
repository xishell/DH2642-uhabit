<script lang="ts">
	import { Avatar } from '@skeletonlabs/skeleton-svelte';
	import { toaster } from '$lib/stores/toaster';

	interface Props {
		name: string;
		bio: string;
		pronouns: string;
		imageUrl?: string | null;
		isUploading?: boolean;
		onAvatarUpload?: (
			file: File
		) => Promise<{ success: boolean; imageUrl?: string; error?: string }>;
	}

	let {
		name,
		bio,
		pronouns,
		imageUrl = null,
		isUploading = false,
		onAvatarUpload
	}: Props = $props();

	const BIO_MAX_LENGTH = 100;
	const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
	const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

	let fileInput: HTMLInputElement;

	const initials = $derived(
		name
			?.split(' ')
			.map((n) => n[0])
			.join('')
			.slice(0, 2)
			.toUpperCase() || '?'
	);

	const displayBio = $derived(
		bio && bio.length > 0
			? bio.length > BIO_MAX_LENGTH
				? bio.slice(0, BIO_MAX_LENGTH) + '...'
				: bio
			: "Hey, I'm..."
	);

	function handleUploadClick() {
		fileInput?.click();
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
			input.value = '';
			return;
		}

		if (file.size > MAX_FILE_SIZE) {
			toaster.error({
				title: 'File too large',
				description: 'Maximum file size is 5MB.'
			});
			input.value = '';
			return;
		}

		// Delegate upload to presenter via callback
		await onAvatarUpload?.(file);

		// Reset input to allow re-selecting same file
		input.value = '';
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
				onchange={handleFileSelect}
				disabled={isUploading}
			/>

			<!-- Upload button -->
			<button
				type="button"
				onclick={handleUploadClick}
				disabled={isUploading}
				class="absolute left-1/2 bottom-0 z-10 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-green-800 text-white cursor-pointer hover:bg-green-900 -translate-x-1/2 translate-y-1/2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{isUploading ? 'Uploading...' : 'Upload'}
			</button>
		</div>

		<div class="flex-1 min-w-0 mt-4 md:mt-0">
			<h3 class="font-semibold text-2xl">{name || 'Your name'}</h3>
			<p class="text-sm opacity-80 mt-1 break-words" title={bio}>
				{displayBio}
			</p>
			{#if pronouns}
				<p class="text-xs opacity-60 mt-1">{pronouns}</p>
			{/if}
		</div>
	</div>
</div>
