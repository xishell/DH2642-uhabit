<script lang="ts">
	import { onMount } from 'svelte';
	import { untrack } from 'svelte';
	import {
		isPushSupported,
		getPushStatus,
		subscribeToPush,
		unsubscribeFromPush,
		type PushStatus
	} from '$lib/notifications/push';
	import { Switch } from '@skeletonlabs/skeleton-svelte';
	import FieldWrapper from './FieldWrapper.svelte';
	import { Bell, BellOff, Flame, Target, Calendar, Clock, AlertCircle } from '@lucide/svelte';

	interface Props {
		pushEnabled: boolean;
		habitReminders: boolean;
		streakMilestones: boolean;
		goalProgress: boolean;
		holidaySuggestions: boolean;
		reminderTime: string;
		onFieldChange?: (field: string, value: unknown) => void;
	}

	let {
		pushEnabled,
		habitReminders,
		streakMilestones,
		goalProgress,
		holidaySuggestions,
		reminderTime,
		onFieldChange
	}: Props = $props();

	// Draft values for local editing
	let draftPushEnabled = $state(untrack(() => pushEnabled));
	let draftHabitReminders = $state(untrack(() => habitReminders));
	let draftStreakMilestones = $state(untrack(() => streakMilestones));
	let draftGoalProgress = $state(untrack(() => goalProgress));
	let draftHolidaySuggestions = $state(untrack(() => holidaySuggestions));
	let draftReminderTime = $state(untrack(() => reminderTime));

	// Push status
	let pushStatus = $state<PushStatus>('unsupported');
	let pushSupported = $state(false);
	let pushLoading = $state(false);

	// Sync draft values when props change (e.g., on discard)
	$effect(() => {
		draftPushEnabled = pushEnabled;
		draftHabitReminders = habitReminders;
		draftStreakMilestones = streakMilestones;
		draftGoalProgress = goalProgress;
		draftHolidaySuggestions = holidaySuggestions;
		draftReminderTime = reminderTime;
	});

	onMount(async () => {
		pushSupported = isPushSupported();
		if (pushSupported) {
			pushStatus = await getPushStatus();
		}
	});

	const draftSetters: Record<string, (v: boolean) => void> = {
		pushEnabled: (v) => (draftPushEnabled = v),
		habitReminders: (v) => (draftHabitReminders = v),
		streakMilestones: (v) => (draftStreakMilestones = v),
		goalProgress: (v) => (draftGoalProgress = v),
		holidaySuggestions: (v) => (draftHolidaySuggestions = v)
	};

	function handleToggle(field: string, value: boolean) {
		draftSetters[field]?.(value);
		onFieldChange?.(field, value);
	}

	function handleTimeChange(event: Event) {
		const value = (event.target as HTMLInputElement).value;
		draftReminderTime = value;
		onFieldChange?.('reminderTime', value);
	}

	async function handlePushToggle() {
		if (pushLoading) return;
		pushLoading = true;

		try {
			if (pushStatus === 'subscribed') {
				const success = await unsubscribeFromPush();
				if (success) {
					pushStatus = 'unsubscribed';
					draftPushEnabled = false;
					onFieldChange?.('pushEnabled', false);
				}
			} else {
				const success = await subscribeToPush();
				if (success) {
					pushStatus = 'subscribed';
					draftPushEnabled = true;
					onFieldChange?.('pushEnabled', true);
				} else {
					pushStatus = await getPushStatus();
				}
			}
		} finally {
			pushLoading = false;
		}
	}
</script>

<section class="space-y-6">
	<h1 class="text-2xl font-bold">Notifications</h1>

	<!-- Push Notifications Card -->
	<div class="card p-6 space-y-4">
		<h2 class="text-lg font-semibold flex items-center gap-2">
			<Bell class="size-5" />
			Push Notifications
		</h2>

		{#if !pushSupported}
			<div class="flex items-start gap-3 p-4 rounded-xl bg-surface-100 dark:bg-surface-800">
				<AlertCircle class="size-5 text-surface-500 flex-shrink-0 mt-0.5" />
				<div>
					<p class="text-sm text-surface-600 dark:text-surface-400">
						Push notifications are not supported in your browser.
					</p>
				</div>
			</div>
		{:else if pushStatus === 'denied'}
			<div class="flex items-start gap-3 p-4 rounded-xl bg-warning-50 dark:bg-warning-900/20">
				<BellOff class="size-5 text-warning-600 dark:text-warning-400 flex-shrink-0 mt-0.5" />
				<div>
					<p class="text-sm font-medium text-warning-700 dark:text-warning-300">
						Notifications blocked
					</p>
					<p class="text-sm text-warning-600 dark:text-warning-400 mt-1">
						You've blocked notifications for this site. To enable them, click the lock icon in your
						browser's address bar and allow notifications.
					</p>
				</div>
			</div>
		{:else}
			<div class="flex items-center justify-between">
				<div>
					<p class="font-medium">Desktop push notifications</p>
					<p class="text-sm text-surface-500 dark:text-surface-400">
						Get notified even when the app is closed
					</p>
				</div>
				<button
					type="button"
					class="btn {pushStatus === 'subscribed'
						? 'preset-filled-primary-500'
						: 'preset-outlined'} min-w-[100px]"
					onclick={handlePushToggle}
					disabled={pushLoading}
				>
					{#if pushLoading}
						<span class="animate-spin">...</span>
					{:else if pushStatus === 'subscribed'}
						<Bell class="size-4 mr-1" />
						Enabled
					{:else}
						<BellOff class="size-4 mr-1" />
						Enable
					{/if}
				</button>
			</div>
		{/if}
	</div>

	<!-- Notification Types Card -->
	<div class="card p-6 space-y-5">
		<h2 class="text-lg font-semibold">Notification Types</h2>
		<p class="text-sm text-surface-500 dark:text-surface-400 -mt-2">
			Choose which notifications you want to receive
		</p>

		<div class="space-y-4">
			<!-- Habit Reminders -->
			<div
				class="flex items-center justify-between p-3 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
			>
				<div class="flex items-center gap-3">
					<div class="p-2 rounded-full bg-primary-100 dark:bg-primary-900/30">
						<Bell class="size-4 text-primary-600 dark:text-primary-400" />
					</div>
					<div>
						<p class="font-medium">Habit reminders</p>
						<p class="text-sm text-surface-500 dark:text-surface-400">
							Daily reminders to complete your habits
						</p>
					</div>
				</div>
				<Switch
					name="habitReminders"
					checked={draftHabitReminders}
					onCheckedChange={(e) => handleToggle('habitReminders', e.checked)}
				>
					<Switch.Control>
						<Switch.Thumb />
					</Switch.Control>
					<Switch.HiddenInput />
				</Switch>
			</div>

			<!-- Streak Milestones -->
			<div
				class="flex items-center justify-between p-3 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
			>
				<div class="flex items-center gap-3">
					<div class="p-2 rounded-full bg-orange-100 dark:bg-orange-900/30">
						<Flame class="size-4 text-orange-600 dark:text-orange-400" />
					</div>
					<div>
						<p class="font-medium">Streak milestones</p>
						<p class="text-sm text-surface-500 dark:text-surface-400">
							Celebrate when you hit 7, 30, 100, or 365 day streaks
						</p>
					</div>
				</div>
				<Switch
					name="streakMilestones"
					checked={draftStreakMilestones}
					onCheckedChange={(e) => handleToggle('streakMilestones', e.checked)}
				>
					<Switch.Control>
						<Switch.Thumb />
					</Switch.Control>
					<Switch.HiddenInput />
				</Switch>
			</div>

			<!-- Goal Progress -->
			<div
				class="flex items-center justify-between p-3 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
			>
				<div class="flex items-center gap-3">
					<div class="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
						<Target class="size-4 text-green-600 dark:text-green-400" />
					</div>
					<div>
						<p class="font-medium">Goal progress</p>
						<p class="text-sm text-surface-500 dark:text-surface-400">
							Updates at 25%, 50%, 75%, and 100% completion
						</p>
					</div>
				</div>
				<Switch
					name="goalProgress"
					checked={draftGoalProgress}
					onCheckedChange={(e) => handleToggle('goalProgress', e.checked)}
				>
					<Switch.Control>
						<Switch.Thumb />
					</Switch.Control>
					<Switch.HiddenInput />
				</Switch>
			</div>

			<!-- Holiday Suggestions -->
			<div
				class="flex items-center justify-between p-3 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
			>
				<div class="flex items-center gap-3">
					<div class="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
						<Calendar class="size-4 text-blue-600 dark:text-blue-400" />
					</div>
					<div>
						<p class="font-medium">Holiday suggestions</p>
						<p class="text-sm text-surface-500 dark:text-surface-400">
							Reschedule suggestions when habits conflict with holidays
						</p>
					</div>
				</div>
				<Switch
					name="holidaySuggestions"
					checked={draftHolidaySuggestions}
					onCheckedChange={(e) => handleToggle('holidaySuggestions', e.checked)}
				>
					<Switch.Control>
						<Switch.Thumb />
					</Switch.Control>
					<Switch.HiddenInput />
				</Switch>
			</div>
		</div>
	</div>

	<!-- Reminder Time Card -->
	<div class="card p-6 space-y-4">
		<h2 class="text-lg font-semibold flex items-center gap-2">
			<Clock class="size-5" />
			Reminder Time
		</h2>

		<FieldWrapper field="reminderTime" label="Daily reminder time">
			<input
				type="time"
				id="reminderTime"
				class="input"
				value={draftReminderTime}
				onchange={handleTimeChange}
			/>
		</FieldWrapper>
		<p class="text-sm text-surface-500 dark:text-surface-400">When to send daily habit reminders</p>
	</div>
</section>
