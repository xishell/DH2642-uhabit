<script lang="ts">
	import type { Notification, NotificationType } from '$lib/types/notification';
	import { Flame, Target, Calendar, Bell, X } from '@lucide/svelte';

	let {
		notification,
		onMarkRead,
		onDismiss
	}: {
		notification: Notification;
		onMarkRead: (id: string) => void;
		onDismiss: (id: string) => void;
	} = $props();

	const iconMap: Record<NotificationType, typeof Flame> = {
		streak_milestone: Flame,
		goal_progress: Target,
		holiday_reschedule: Calendar,
		habit_reminder: Bell
	};

	const colorMap: Record<NotificationType, string> = {
		streak_milestone: 'text-orange-500',
		goal_progress: 'text-green-500',
		holiday_reschedule: 'text-blue-500',
		habit_reminder: 'text-primary-500'
	};

	const Icon = $derived(iconMap[notification.type] || Bell);
	const iconColor = $derived(colorMap[notification.type] || 'text-primary-500');

	function formatTimeAgo(date: Date): string {
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const minutes = Math.floor(diff / 60000);
		const hours = Math.floor(diff / 3600000);
		const days = Math.floor(diff / 86400000);

		if (minutes < 1) return 'Just now';
		if (minutes < 60) return `${minutes}m ago`;
		if (hours < 24) return `${hours}h ago`;
		if (days < 7) return `${days}d ago`;
		return date.toLocaleDateString();
	}

	function handleClick() {
		if (!notification.read) {
			onMarkRead(notification.id);
		}
	}

	function handleDismiss(e: MouseEvent) {
		e.stopPropagation();
		onDismiss(notification.id);
	}
</script>

<div
	class="group relative flex gap-3 p-3 sm:p-3 rounded-xl cursor-pointer transition-colors active:scale-[0.98] {notification.read
		? 'bg-transparent hover:bg-surface-100 dark:hover:bg-surface-800'
		: 'bg-primary-50 dark:bg-primary-950/30 hover:bg-primary-100 dark:hover:bg-primary-900/40'}"
	onclick={handleClick}
	onkeydown={(e) => e.key === 'Enter' && handleClick()}
	role="button"
	tabindex="0"
>
	<div
		class="flex-shrink-0 w-10 h-10 sm:w-9 sm:h-9 rounded-full flex items-center justify-center bg-surface-100 dark:bg-surface-800"
	>
		<Icon class="size-5 sm:size-4 {iconColor}" />
	</div>

	<div class="flex-1 min-w-0">
		<div class="flex items-start justify-between gap-2">
			<p
				class="text-sm font-medium text-surface-900 dark:text-surface-100 {notification.read
					? 'font-normal'
					: 'font-semibold'}"
			>
				{notification.title}
			</p>
			{#if !notification.read}
				<span class="flex-shrink-0 w-2 h-2 rounded-full bg-primary-500 mt-1.5"></span>
			{/if}
		</div>
		<p class="text-sm text-surface-600 dark:text-surface-400 line-clamp-2 mt-0.5">
			{notification.body}
		</p>
		<p class="text-xs text-surface-400 dark:text-surface-500 mt-1">
			{formatTimeAgo(notification.createdAt)}
		</p>
	</div>

	<button
		type="button"
		class="absolute top-2 right-2 p-1.5 rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 bg-surface-200/80 dark:bg-surface-700/80 sm:bg-transparent hover:bg-surface-200 dark:hover:bg-surface-700 transition-all"
		onclick={handleDismiss}
		aria-label="Dismiss notification"
	>
		<X class="size-4 sm:size-3.5 text-surface-500" />
	</button>
</div>
