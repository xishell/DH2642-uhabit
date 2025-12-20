<script lang="ts">
	let {
		content = 'button'
	}: {
		content?: string;
	} = $props();
	// export let variant = 'primary';
	// const variants = {
	// 	primary: '',
	// 	secondary: 'bg-gray-200 text-gray-800',
	// 	danger: 'bg-red-500 text-white'
	// };
</script>

<button
	class="bg-surface-300 dark:bg-surface-600 rounded-full py-2 px-6 hover:bg-surface-200 dark:hover:bg-surface-500 transition-colors duration-300 cursor-pointer"
	>{content}</button
>
