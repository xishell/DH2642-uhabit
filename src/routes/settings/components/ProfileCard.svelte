<script lang="ts">
	export let displayName: string;
	export let bio: string;
	export let pronouns: string;

	const imgSrc =
		'https://images.unsplash.com/photo-1463171515643-952cee54d42a?q=80&w=450&h=190&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';
</script>

<div
	class="card preset-filled-surface-100-900 border-[1px] border-surface-200-800 card-hover divide-surface-200-800 block max-w-md divide-y overflow-hidden"
>
	<header>
		<img src={imgSrc} class="aspect-[21/9] w-full grayscale hue-rotate-90" alt="banner" />
	</header>

	<article class="space-y-4 p-4">
		<div>
			<h2 class="h6">Profile</h2>
			<p class="h3">{displayName || 'Your Name'}</p>
		</div>
		<p class="opacity-60">{bio || 'Your bio will appear here.'}</p>
	</article>

	<footer class="flex items-center justify-between gap-4 p-4">
		<small class="opacity-60">{pronouns}</small>
		<small class="opacity-60">Updated {new Date().toLocaleDateString()}</small>
	</footer>
</div>
