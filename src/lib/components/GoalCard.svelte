<script lang="ts">
	import { ChevronDown, ChevronUp, Calendar, Edit2 } from 'lucide-svelte';
	import { slide } from 'svelte/transition';
	import type { GoalWithProgress, GoalWithHabitStatus } from '$lib/types/goal';
	import type { Habit, HabitWithStatus } from '$lib/types/habit';

	let {
		goal,
		expanded = false,
		onedit
	}: {
		goal: GoalWithProgress | GoalWithHabitStatus;
		expanded?: boolean;
		onedit?: (goal: GoalWithProgress | GoalWithHabitStatus) => void;
	} = $props();

	let isExpanded = $state(expanded);

	// Update isExpanded when prop changes
	$effect(() => {
		isExpanded = expanded;
	});

	function toggleExpand() {
		isExpanded = !isExpanded;
	}

	function formatDate(date: Date | string): string {
		const d = new Date(date);
		return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}

	function formatDateRange(start: Date | string, end: Date | string): string {
		return `${formatDate(start)} - ${formatDate(end)}`;
	}

	// Check if goal has today's status (GoalWithHabitStatus)
	const hasTodayStatus = $derived('todayCompleted' in goal);

	// Helper to check if habit item is HabitWithStatus (wrapped) or plain Habit
	function isHabitWithStatus(h: Habit | HabitWithStatus): h is HabitWithStatus {
		return 'habit' in h && 'isCompleted' in h;
	}

	// Get habit data regardless of wrapper
	function getHabitData(h: Habit | HabitWithStatus): Habit {
		return isHabitWithStatus(h) ? h.habit : h;
	}

	const habits = $derived(goal.habits || []);
	const habitCount = $derived(habits.length);
</script>

<div class="rounded-xl border border-surface-200-700 bg-surface-50-900 overflow-hidden">
	<!-- Header (always visible) -->
	<div class="flex items-center gap-4 p-4 hover:bg-surface-100-800 transition-colors">
		<!-- Expand/Collapse Button -->
		<button
			type="button"
			class="text-surface-400 hover:text-surface-600 transition-colors"
			onclick={toggleExpand}
			aria-label={isExpanded ? 'Collapse' : 'Expand'}
		>
			{#if isExpanded}
				<ChevronUp size={20} />
			{:else}
				<ChevronDown size={20} />
			{/if}
		</button>

		<!-- Goal Info (clickable to expand) -->
		<button type="button" class="flex-1 min-w-0 text-left" onclick={toggleExpand}>
			<div class="flex items-center gap-2">
				<h3 class="font-semibold truncate">{goal.title}</h3>
				{#if goal.isCompleted}
					<span
						class="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
					>
						Complete
					</span>
				{/if}
			</div>
			<div class="flex items-center gap-2 text-xs text-surface-500 mt-1">
				<Calendar size={12} />
				<span>{formatDateRange(goal.startDate, goal.endDate)}</span>
				<span class="mx-1">·</span>
				<span>{habitCount} habit{habitCount !== 1 ? 's' : ''}</span>
			</div>
		</button>

		<!-- Progress -->
		<div class="flex items-center gap-3">
			{#if hasTodayStatus}
				<div class="text-right">
					<div class="text-sm font-medium">
						{(goal as GoalWithHabitStatus).todayCompleted}/{(goal as GoalWithHabitStatus)
							.todayTotal}
					</div>
					<div class="text-xs text-surface-500">today</div>
				</div>
			{/if}
			<div class="w-16 h-2 bg-surface-200-700 rounded-full overflow-hidden">
				<div
					class="h-full bg-primary-500 transition-all duration-300"
					style="width: {goal.progressPercentage}%"
				></div>
			</div>
			<span class="text-sm font-medium w-10 text-right">{Math.round(goal.progressPercentage)}%</span
			>
		</div>

		<!-- Edit Button -->
		{#if onedit}
			<button
				type="button"
				class="p-2 rounded-lg hover:bg-surface-200-700 transition-colors"
				onclick={() => onedit(goal)}
				aria-label="Edit goal"
			>
				<Edit2 size={16} />
			</button>
		{/if}
	</div>

	<!-- Expanded Content -->
	{#if isExpanded}
		<div transition:slide={{ duration: 200 }} class="border-t border-surface-200-700">
			{#if goal.description}
				<p
					class="px-4 py-3 text-sm text-surface-600 dark:text-surface-400 border-b border-surface-200-700"
				>
					{goal.description}
				</p>
			{/if}

			{#if habitCount === 0}
				<p class="px-4 py-6 text-sm text-surface-500 text-center">
					No habits attached to this goal.
				</p>
			{:else}
				<div class="divide-y divide-surface-100-800">
					{#each habits as habitItem}
						{@const habit = getHabitData(habitItem)}
						{@const hasStatus = isHabitWithStatus(habitItem)}
						<div class="px-4 py-3 flex items-center gap-3">
							<!-- Color indicator -->
							{#if habit.color}
								<div class="w-2 h-8 rounded-full" style="background-color: {habit.color}"></div>
							{/if}

							<!-- Habit info -->
							<div class="flex-1 min-w-0">
								<div class="font-medium text-sm truncate">{habit.title}</div>
								<div class="text-xs text-surface-500 capitalize">{habit.frequency}</div>
							</div>

							<!-- Habit status (if available) -->
							{#if hasStatus}
								{@const status = habitItem as HabitWithStatus}
								{#if habit.measurement === 'boolean'}
									<div
										class="w-6 h-6 rounded-full border-2 flex items-center justify-center"
										class:border-green-500={status.isCompleted}
										class:bg-green-500={status.isCompleted}
										class:border-surface-300-600={!status.isCompleted}
									>
										{#if status.isCompleted}
											<svg
												class="w-4 h-4 text-white"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="3"
													d="M5 13l4 4L19 7"
												/>
											</svg>
										{/if}
									</div>
								{:else}
									<div class="text-right">
										<div class="text-sm font-medium">
											{status.progress}/{status.target ?? habit.targetAmount ?? 0}
										</div>
										<div class="text-xs text-surface-500">{habit.unit ?? ''}</div>
									</div>
								{/if}
							{:else}
								<!-- Just show habit type indicator -->
								<span class="text-xs px-2 py-1 rounded bg-surface-100-800 capitalize">
									{habit.measurement === 'numeric' ? 'Progress' : 'Checkbox'}
								</span>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>
