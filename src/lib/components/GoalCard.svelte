<script lang="ts">
	import { ChevronDown, ChevronUp, Calendar, Edit2 } from 'lucide-svelte';
	import { slide } from 'svelte/transition';
	import { untrack } from 'svelte';
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

	// Expansion state starts from prop, then component owns it
	let isExpanded = $state(untrack(() => expanded));

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

	const formatUnitCount = (val: number) => (Number.isInteger(val) ? `${val}` : val.toFixed(1));
	const limitList = (items: string[], limit = 3) => {
		const full = items.join(', ');
		if (items.length <= limit) return { full, compact: full };
		return {
			full,
			compact: `${items.slice(0, limit).join(', ')} +${items.length - limit} more`
		};
	};

	// Whether goal has today's status
	const hasTodayStatus = $derived('todayCompleted' in goal);

	// Check if item is HabitWithStatus or plain Habit
	function isHabitWithStatus(h: Habit | HabitWithStatus): h is HabitWithStatus {
		return 'habit' in h && 'isCompleted' in h;
	}

	// Get habit data regardless of wrapper
	function getHabitData(h: Habit | HabitWithStatus): Habit {
		return isHabitWithStatus(h) ? h.habit : h;
	}

	function formatFrequency(h: Habit): { full: string; compact: string } {
		if (h.frequency === 'daily') return { full: 'Daily', compact: 'Daily' };
		if (h.frequency === 'weekly') {
			if (!h.period?.length) return { full: 'Weekly', compact: 'Weekly' };
			const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
			const days = h.period.map((d) => labels[d] || `${d}`);
			const { full, compact } = limitList(days, 4);
			return { full: `Weekly on ${full}`, compact: `Weekly on ${compact}` };
		}
		if (!h.period?.length) return { full: 'Monthly', compact: 'Monthly' };
		const suffix = (n: number) => {
			if (n % 10 === 1 && n % 100 !== 11) return `${n}st`;
			if (n % 10 === 2 && n % 100 !== 12) return `${n}nd`;
			if (n % 10 === 3 && n % 100 !== 13) return `${n}rd`;
			return `${n}th`;
		};
		const dates = h.period.map(suffix);
		const { full, compact } = limitList(dates, 3);
		return { full: `Monthly on ${full}`, compact: `Monthly on ${compact}` };
	}

	const habits = $derived(goal.habits || []);
	const habitCount = $derived(habits.length);
</script>

<div
	class="rounded-xl border-[1.5px] border-surface-200 dark:border-surface-700 bg-surface-100 dark:bg-surface-800 overflow-hidden"
>
	<!-- Header -->
	<div
		class="flex items-center gap-4 p-4 min-h-[68px] hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
	>
		<!-- Color indicator -->
		{#if goal.color}
			<div class="w-3 h-8 rounded-full shrink-0" style="background-color: {goal.color}"></div>
		{/if}

		<!-- Expand/Collapse -->
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

		<!-- Goal info -->
		<button type="button" class="flex-1 min-w-0 text-left" onclick={toggleExpand}>
			<div class="flex items-center gap-2">
				<h3 class="font-semibold truncate">{goal.title}</h3>
				{#if goal.isCompleted}
					<span
						class="text-xs px-2 py-0.5 rounded-full bg-success-100 text-success-700 dark:bg-success-900 dark:text-success-300"
					>
						Complete
					</span>
				{/if}
			</div>
			<div class="flex flex-col gap-1 text-xs text-surface-500 mt-1">
				<span class="flex items-center gap-1">
					<Calendar size={12} />
					{formatDateRange(goal.startDate, goal.endDate)}
				</span>
				<span>{habitCount} habit{habitCount !== 1 ? 's' : ''}</span>
			</div>
		</button>

		<!-- Progress -->
		<div class="flex items-center gap-3">
			{#if hasTodayStatus}
				<div class="text-right">
					<div class="text-sm font-medium">
						{formatUnitCount((goal as GoalWithHabitStatus).todayCompleted)}/{(
							goal as GoalWithHabitStatus
						).todayTotal}
					</div>
					<div class="text-xs text-surface-500">today</div>
				</div>
			{/if}
			<!-- Circular progress indicator -->
			<div class="relative w-10 h-10 shrink-0">
				<svg class="w-full h-full -rotate-90" viewBox="0 0 36 36">
					<!-- Background circle -->
					<circle
						class="stroke-surface-300 dark:stroke-surface-600"
						stroke-width="3"
						fill="none"
						cx="18"
						cy="18"
						r="15"
					/>
					<!-- Progress circle -->
					<circle
						class="stroke-primary-500 transition-all duration-300"
						stroke-width="3"
						stroke-linecap="round"
						fill="none"
						cx="18"
						cy="18"
						r="15"
						stroke-dasharray="94.2"
						stroke-dashoffset={94.2 - (94.2 * goal.progressPercentage) / 100}
					/>
				</svg>
				<span class="absolute inset-0 flex items-center justify-center text-[10px] font-medium">
					{Math.round(goal.progressPercentage)}%
				</span>
			</div>
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
						{@const frequency = formatFrequency(habit)}
						<div class="px-4 py-3 flex items-center gap-3">
							<!-- Color indicator -->
							{#if habit.color}
								<div class="w-2 h-8 rounded-full" style="background-color: {habit.color}"></div>
							{/if}

							<!-- Habit info -->
							<div class="flex-1 min-w-0">
								<div class="font-medium text-sm truncate">{habit.title}</div>
								<span
									class="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-primary-50-900 text-primary-900-100 mt-0.5 max-w-full min-w-0"
									title={frequency.full}
								>
									<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M8 7h8M8 11h8m-6 4h6M5 4h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z"
										/>
									</svg>
									<span class="truncate">{frequency.compact}</span>
								</span>
							</div>

							<!-- Habit status (if available) -->
							{#if hasStatus}
								{@const status = habitItem as HabitWithStatus}
								{#if habit.measurement === 'boolean'}
									<div
										class="w-6 h-6 rounded-full border-2 flex items-center justify-center"
										class:border-success-500={status.isCompleted}
										class:bg-success-500={status.isCompleted}
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
