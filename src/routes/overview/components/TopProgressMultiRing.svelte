<script lang="ts">
	import type { HabitWithStatus } from '$lib/types/habit';
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { untrack } from 'svelte';

	let {
		single = [],
		progressive = [],
		maxRings = 4,
		showInnerRings = true
	}: {
		single?: HabitWithStatus[];
		progressive?: HabitWithStatus[];
		maxRings?: number;
		showInnerRings?: boolean;
	} = $props();

	const animationDuration = 250;
	const progressAnimationDuration = 500;
	const staggerDelay = 80;

	const total = $derived(single.length + progressive.length);
	const completionSum = $derived(
		single.filter((s) => s.isCompleted).length +
			progressive.reduce((sum, p) => {
				const target = p.target ?? p.habit.targetAmount ?? 0;
				if (target <= 0) return sum;
				return sum + Math.min(1, p.progress / target);
			}, 0)
	);
	const totalPct = $derived(total === 0 ? 0 : Math.round((completionSum / total) * 100));

	const outerPctTweened = tweened(0, { duration: 0, easing: cubicOut });
	let initialLoadDone = false;

	$effect(() => {
		const pct = totalPct;
		if (!initialLoadDone) {
			outerPctTweened.set(pct, { duration: 0 });
			setTimeout(() => {
				initialLoadDone = true;
			}, 50);
		} else {
			outerPctTweened.set(pct, { duration: progressAnimationDuration });
		}
	});

	const progressiveRings = $derived(
		progressive.slice(0, maxRings).map((p) => ({
			id: p.habit.id,
			title: p.habit.title,
			percentage:
				p.target && p.target > 0 ? Math.min(100, Math.round((p.progress / p.target) * 100)) : 0,
			color: p.habit.color || null,
			progress: p.progress,
			target: p.target
		}))
	);

	const defaultColors = ['#ef4444', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];

	const size = 260;
	const outerStrokeWidth = 18;
	const innerStrokeWidth = 12;
	const outerInnerGap = 8;
	const innerRingSpacing = 10;

	function getRingRadius(index: number): number {
		if (index === 0) return (size - outerStrokeWidth) / 2;
		const baseRadius = (size - outerStrokeWidth) / 2;
		const firstInnerRadius =
			baseRadius - outerStrokeWidth / 2 - outerInnerGap - innerStrokeWidth / 2;
		return firstInnerRadius - (index - 1) * innerRingSpacing;
	}

	const outerRadiusValue = (size - outerStrokeWidth) / 2;
	const svgHeightValue = outerRadiusValue + outerStrokeWidth;

	function getArcPath(radius: number): string {
		const centerX = size / 2;
		const centerY = svgHeightValue - outerStrokeWidth / 2;
		const startX = centerX - radius;
		const endX = centerX + radius;
		return `M ${startX} ${centerY} A ${radius} ${radius} 0 0 1 ${endX} ${centerY}`;
	}

	function getProgressValues(radius: number, percentage: number) {
		const circumference = Math.PI * radius;
		const offset = circumference - (percentage / 100) * circumference;
		return { circumference, offset };
	}

	const outerRadius = $derived(getRingRadius(0));
	const outerArcPath = $derived(getArcPath(outerRadius));
	const outerProgress = $derived(getProgressValues(outerRadius, $outerPctTweened));
	const svgHeight = svgHeightValue;

	const collapsedRadius = (size - outerStrokeWidth) / 2;
	const ring0Radius = tweened(collapsedRadius, { duration: animationDuration, easing: cubicOut });
	const ring1Radius = tweened(collapsedRadius, { duration: animationDuration, easing: cubicOut });
	const ring2Radius = tweened(collapsedRadius, { duration: animationDuration, easing: cubicOut });
	const ring3Radius = tweened(collapsedRadius, { duration: animationDuration, easing: cubicOut });

	const ring0Opacity = tweened(0, { duration: animationDuration, easing: cubicOut });
	const ring1Opacity = tweened(0, { duration: animationDuration, easing: cubicOut });
	const ring2Opacity = tweened(0, { duration: animationDuration, easing: cubicOut });
	const ring3Opacity = tweened(0, { duration: animationDuration, easing: cubicOut });

	const ring0Pct = tweened(0, { duration: 0, easing: cubicOut });
	const ring1Pct = tweened(0, { duration: 0, easing: cubicOut });
	const ring2Pct = tweened(0, { duration: 0, easing: cubicOut });
	const ring3Pct = tweened(0, { duration: 0, easing: cubicOut });

	const radiusStores = [ring0Radius, ring1Radius, ring2Radius, ring3Radius];
	const opacityStores = [ring0Opacity, ring1Opacity, ring2Opacity, ring3Opacity];
	const pctStores = [ring0Pct, ring1Pct, ring2Pct, ring3Pct];

	let innerInitialLoadDone = false;
	$effect(() => {
		const rings = progressiveRings;
		const duration = innerInitialLoadDone ? progressAnimationDuration : 0;

		for (let i = 0; i < maxRings; i++) {
			const pct = rings[i]?.percentage ?? 0;
			pctStores[i].set(pct, { duration });
		}

		if (!innerInitialLoadDone) {
			setTimeout(() => {
				innerInitialLoadDone = true;
			}, 50);
		}
	});

	$effect(() => {
		const shouldShow = showInnerRings;
		const timeoutIds: ReturnType<typeof setTimeout>[] = [];
		const numRings = untrack(() => Math.min(progressive.length, maxRings));

		if (shouldShow) {
			for (let i = 0; i < numRings; i++) {
				const delay = i * staggerDelay;
				const id = setTimeout(() => {
					radiusStores[i].set(getRingRadius(i + 1));
					opacityStores[i].set(1);
				}, delay);
				timeoutIds.push(id);
			}
		} else {
			for (let i = 0; i < maxRings; i++) {
				opacityStores[i].set(0);
				radiusStores[i].set(collapsedRadius);
			}
		}

		return () => timeoutIds.forEach((id) => clearTimeout(id));
	});
</script>

<div class="mb-6 flex justify-center">
	<div
		class="bg-surface-100 dark:bg-surface-800 pt-4 pb-2 px-6 rounded-xl flex items-end justify-center shadow w-full max-w-2xl"
	>
		<div class="mx-auto" style="width: {size}px; height: {svgHeight}px;">
			<svg
				viewBox="0 0 {size} {svgHeight}"
				preserveAspectRatio="xMidYMid meet"
				class="block mx-auto"
				style="width: 100%; height: 100%;"
			>
				<path
					d={outerArcPath}
					fill="none"
					class="stroke-surface-300 dark:stroke-surface-700"
					stroke-width={outerStrokeWidth}
					stroke-linecap="round"
				/>

				<path
					d={outerArcPath}
					fill="none"
					class="stroke-primary-400"
					stroke-width={outerStrokeWidth}
					stroke-linecap="round"
					stroke-dasharray={outerProgress.circumference}
					stroke-dashoffset={outerProgress.offset}
				/>

				<text
					x={size / 2}
					y={svgHeight - 45}
					text-anchor="middle"
					class="fill-surface-900 dark:fill-surface-50 text-4xl font-bold"
					style="font-size: 2.25rem;"
				>
					{Math.round($outerPctTweened)}%
				</text>
				<text
					x={size / 2}
					y={svgHeight - 20}
					text-anchor="middle"
					class="fill-surface-500 dark:fill-surface-400 text-sm"
					style="font-size: 0.875rem;"
				>
					completed today
				</text>

				{#each progressiveRings as ring, index}
					{@const animatedRadius =
						index === 0
							? $ring0Radius
							: index === 1
								? $ring1Radius
								: index === 2
									? $ring2Radius
									: $ring3Radius}
					{@const animatedOpacity =
						index === 0
							? $ring0Opacity
							: index === 1
								? $ring1Opacity
								: index === 2
									? $ring2Opacity
									: $ring3Opacity}
					{@const animatedPct =
						index === 0 ? $ring0Pct : index === 1 ? $ring1Pct : index === 2 ? $ring2Pct : $ring3Pct}
					{@const ringCircumference = Math.PI * animatedRadius}
					{@const ringOffset = ringCircumference - (animatedPct / 100) * ringCircumference}
					{@const ringPath = getArcPath(animatedRadius)}
					{@const ringColor = ring.color || defaultColors[index % defaultColors.length]}

					{#if animatedPct > 0}
						<path
							d={ringPath}
							fill="none"
							stroke={ringColor}
							stroke-width={innerStrokeWidth}
							stroke-linecap="round"
							stroke-dasharray={ringCircumference}
							stroke-dashoffset={ringOffset}
							style="opacity: {animatedOpacity};"
						/>
					{/if}
				{/each}
			</svg>
		</div>
	</div>
</div>
