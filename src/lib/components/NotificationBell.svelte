<script lang="ts">
	import { onMount } from 'svelte';
	import { Popover, Portal } from '@skeletonlabs/skeleton-svelte';
	import { Bell, CheckCheck, Loader2 } from '@lucide/svelte';
	import { notificationStore } from '$lib/stores/notifications.svelte';
	import NotificationItem from './NotificationItem.svelte';

	let isOpen = $state(false);
	let isClosing = $state(false);

	onMount(() => {
		notificationStore.fetchUnreadCount();
	});

	async function handleOpen() {
		if (!notificationStore.initialized) {
			await notificationStore.fetchNotifications(true);
		}
	}

	function handleOpenChange(details: { open: boolean }) {
		if (details.open) {
			isClosing = false;
			isOpen = true;
			handleOpen();
		} else {
			// Start closing animation
			isClosing = true;
			// Delay actual close until animation completes
			setTimeout(() => {
				isOpen = false;
				isClosing = false;
			}, 150);
		}
	}

	function handleMarkRead(id: string) {
		notificationStore.markAsRead(id);
	}

	function handleDismiss(id: string) {
		notificationStore.dismiss(id);
	}

	function handleMarkAllRead() {
		notificationStore.markAllAsRead();
	}

	function handleLoadMore() {
		notificationStore.loadMore();
	}
</script>

<Popover
	open={isOpen}
	onOpenChange={handleOpenChange}
	positioning={{ placement: 'bottom-end', gutter: 8 }}
>
	<Popover.Trigger
		class="relative p-2 rounded-full hover:bg-surface-200 dark:hover:bg-surface-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-400 transition-colors"
		aria-label="Notifications"
	>
		<Bell class="size-5 text-surface-600 dark:text-surface-400" />
		{#if notificationStore.unreadCount > 0}
			<span
				class="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1.5 flex items-center justify-center text-xs font-bold text-white bg-red-500 rounded-full"
			>
				{notificationStore.unreadCount > 99 ? '99+' : notificationStore.unreadCount}
			</span>
		{/if}
	</Popover.Trigger>

	<Portal>
		<Popover.Positioner class="!z-[9999]">
			<Popover.Content
				class="notification-dropdown w-[calc(100vw-1rem)] sm:w-96 max-h-[80vh] sm:max-h-[70vh] flex flex-col rounded-2xl bg-surface-50 dark:bg-surface-900 shadow-xl border border-surface-200 dark:border-surface-700 overflow-hidden {isClosing
					? 'is-closing'
					: ''}"
			>
				<!-- Header -->
				<div
					class="flex items-center justify-between px-4 py-3 sm:py-3 border-b border-surface-200 dark:border-surface-700"
				>
					<Popover.Title
						class="text-base sm:text-sm font-semibold text-surface-900 dark:text-surface-100"
					>
						Notifications
					</Popover.Title>
					{#if notificationStore.unreadCount > 0}
						<button
							type="button"
							class="flex items-center gap-1.5 px-2 py-1 -mr-2 rounded-lg text-xs sm:text-xs text-primary-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:text-primary-400 dark:hover:bg-primary-950/50 transition-colors"
							onclick={handleMarkAllRead}
						>
							<CheckCheck class="size-4 sm:size-3.5" />
							Mark all read
						</button>
					{/if}
				</div>

				<!-- Notification list -->
				<div class="flex-1 overflow-y-auto">
					{#if notificationStore.loading && notificationStore.notifications.length === 0}
						<div class="flex items-center justify-center py-12">
							<Loader2 class="size-6 text-surface-400 animate-spin" />
						</div>
					{:else if notificationStore.notifications.length === 0}
						<div class="flex flex-col items-center justify-center py-12 px-4 text-center">
							<Bell class="size-10 text-surface-300 dark:text-surface-600 mb-3" />
							<Popover.Description class="text-sm text-surface-500 dark:text-surface-400">
								No notifications yet
							</Popover.Description>
							<p class="text-xs text-surface-400 dark:text-surface-500 mt-1">
								We'll notify you when something important happens
							</p>
						</div>
					{:else}
						<div class="p-2 space-y-1">
							{#each notificationStore.notifications as notification (notification.id)}
								<NotificationItem
									{notification}
									onMarkRead={handleMarkRead}
									onDismiss={handleDismiss}
								/>
							{/each}
						</div>

						{#if notificationStore.hasMore}
							<div class="px-3 pb-3">
								<button
									type="button"
									class="w-full py-3 sm:py-2 text-sm font-medium text-primary-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:text-primary-400 dark:hover:bg-primary-950/50 rounded-xl transition-colors disabled:opacity-50"
									onclick={handleLoadMore}
									disabled={notificationStore.loading}
								>
									{#if notificationStore.loading}
										<Loader2 class="size-4 animate-spin inline mr-1" />
										Loading...
									{:else}
										Load more
									{/if}
								</button>
							</div>
						{/if}
					{/if}
				</div>
			</Popover.Content>
		</Popover.Positioner>
	</Portal>
</Popover>

<style>
	@keyframes slide-down {
		from {
			opacity: 0;
			transform: translateY(-6px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes slide-up {
		from {
			opacity: 1;
			transform: translateY(0);
		}
		to {
			opacity: 0;
			transform: translateY(-6px);
		}
	}

	:global(.notification-dropdown) {
		animation: slide-down 150ms ease-out;
	}

	:global(.notification-dropdown.is-closing) {
		animation: slide-up 150ms ease-in forwards;
	}
</style>
