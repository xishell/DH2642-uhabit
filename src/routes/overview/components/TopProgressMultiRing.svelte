<script lang="ts">
	import type { HabitWithStatus } from '$lib/types/habit';
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';

	let {
		single = [],
		progressive = [],
		maxRings = 4, // Maximum number of progressive habit rings to show
		showInnerRings = true // Whether to show individual progressive habit rings
	}: {
		single?: HabitWithStatus[];
		progressive?: HabitWithStatus[];
		maxRings?: number;
		showInnerRings?: boolean;
	} = $props();

	// Animation duration per ring
	const animationDuration = 250;
	const staggerDelay = 80;

	// Calculate overall completion (progressive tasks contribute partial progress)
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

	// Get top progressive habits with their percentages
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

	// Color palette for rings (used when habit.color is null)
	const defaultColors = [
		'#ef4444', // red-500
		'#10b981', // emerald-500
		'#3b82f6', // blue-500
		'#f59e0b', // amber-500
		'#8b5cf6', // violet-500
		'#ec4899' // pink-500
	];

	// SVG dimensions
	const size = 260;
	const outerStrokeWidth = 18; // Thicker for total progress
	const innerStrokeWidth = 12; // Thinner for individual habits
	const outerInnerGap = 8; // Gap between outer ring and inner rings

	// Calculate radius for each ring
	function getRingRadius(index: number): number {
		if (index === 0) {
			// Outer ring (total progress)
			return (size - outerStrokeWidth) / 2;
		}
		// Inner rings (progressive habits) - no gap between them
		const baseRadius = (size - outerStrokeWidth) / 2;
		const firstInnerRadius = baseRadius - outerStrokeWidth / 2 - outerInnerGap - innerStrokeWidth / 2;
		return firstInnerRadius - (index - 1) * innerStrokeWidth;
	}

	// Calculate outer radius from constants (same as getRingRadius(0))
	const outerRadiusValue = (size - outerStrokeWidth) / 2; // = 94

	// SVG height - arc peaks at top, endpoints at bottom
	const svgHeightValue = outerRadiusValue + outerStrokeWidth; // = 94 + 12 = 106

	// Generate SVG arc path - rings should be concentric, curving downward (arch shape)
	function getArcPath(radius: number): string {
		const centerX = size / 2;
		// Arc endpoints at BOTTOM of viewBox, arc curves UP to peak then back down
		const centerY = svgHeightValue - outerStrokeWidth / 2;
		const startX = centerX - radius;
		const endX = centerX + radius;
		// sweep=1 makes arc curve toward negative Y (upward to peak), creating arch shape
		return `M ${startX} ${centerY} A ${radius} ${radius} 0 0 1 ${endX} ${centerY}`;
	}

	// Calculate stroke dasharray and offset for progress
	function getProgressValues(radius: number, percentage: number) {
		const circumference = Math.PI * radius;
		const offset = circumference - (percentage / 100) * circumference;
		return { circumference, offset };
	}

	// Outer ring calculations
	const outerRadius = $derived(getRingRadius(0));
	const outerArcPath = $derived(getArcPath(outerRadius));
	const outerProgress = $derived(getProgressValues(outerRadius, totalPct));

	// Use the pre-calculated height
	const svgHeight = svgHeightValue;

	// Animated ring states - create tweened values for each possible ring
	const ring0Radius = tweened(getRingRadius(1), { duration: animationDuration, easing: cubicOut });
	const ring1Radius = tweened(getRingRadius(2), { duration: animationDuration, easing: cubicOut });
	const ring2Radius = tweened(getRingRadius(3), { duration: animationDuration, easing: cubicOut });
	const ring3Radius = tweened(getRingRadius(4), { duration: animationDuration, easing: cubicOut });

	const ring0Opacity = tweened(1, { duration: animationDuration, easing: cubicOut });
	const ring1Opacity = tweened(1, { duration: animationDuration, easing: cubicOut });
	const ring2Opacity = tweened(1, { duration: animationDuration, easing: cubicOut });
	const ring3Opacity = tweened(1, { duration: animationDuration, easing: cubicOut });

	const radiusStores = [ring0Radius, ring1Radius, ring2Radius, ring3Radius];
	const opacityStores = [ring0Opacity, ring1Opacity, ring2Opacity, ring3Opacity];

	// Animate rings when showInnerRings changes
	$effect(() => {
		const numRings = Math.min(progressiveRings.length, maxRings);

		if (showInnerRings) {
			// Expand: outermost inner ring first, then progressively inner ones
			for (let i = 0; i < numRings; i++) {
				const delay = i * staggerDelay;
				setTimeout(() => {
					radiusStores[i].set(getRingRadius(i + 1));
					opacityStores[i].set(1);
				}, delay);
			}
		} else {
			// Collapse: innermost ring first (gets absorbed by ring above it)
			for (let i = numRings - 1; i >= 0; i--) {
				const delay = (numRings - 1 - i) * staggerDelay;
				// Each ring animates to the radius of the ring above it (or outer ring)
				const targetRadius = i === 0 ? outerRadius : getRingRadius(i);
				setTimeout(() => {
					radiusStores[i].set(targetRadius);
					opacityStores[i].set(0);
				}, delay);
			}
		}
	});
</script>

<div class="mb-6 flex justify-center">
	<div
		class="bg-surface-900 pt-4 px-6 rounded-xl flex items-end justify-center shadow w-full max-w-2xl"
	>
		<!-- Multi-Ring Progress Visualization -->
		<div class="mx-auto" style="width: {size}px; height: {svgHeight}px;">
			<svg
				viewBox="0 0 {size} {svgHeight}"
				preserveAspectRatio="xMidYMid meet"
				class="block mx-auto"
				style="width: 100%; height: 100%;"
			>
				<!-- Outer Ring: Total Daily Progress -->
				<!-- Background arc -->
				<path
					d={outerArcPath}
					fill="none"
					class="stroke-surface-700"
					stroke-width={outerStrokeWidth}
					stroke-linecap="round"
				/>

				<!-- Progress arc -->
				<path
					d={outerArcPath}
					fill="none"
					class="stroke-primary-400"
					stroke-width={outerStrokeWidth}
					stroke-linecap="round"
					stroke-dasharray={outerProgress.circumference}
					stroke-dashoffset={outerProgress.offset}
					style="transition: stroke-dashoffset 0.5s ease;"
				/>

				<!-- Inner Rings: Individual Progressive Habits -->
				{#each progressiveRings as ring, index}
					{@const animatedRadius = index === 0 ? $ring0Radius : index === 1 ? $ring1Radius : index === 2 ? $ring2Radius : $ring3Radius}
					{@const animatedOpacity = index === 0 ? $ring0Opacity : index === 1 ? $ring1Opacity : index === 2 ? $ring2Opacity : $ring3Opacity}
					{@const ringCircumference = Math.PI * animatedRadius}
					{@const ringOffset = ringCircumference - (ring.percentage / 100) * ringCircumference}
					{@const ringPath = getArcPath(animatedRadius)}
					{@const ringColor = ring.color || defaultColors[index % defaultColors.length]}

					<!-- Background arc -->
					<path
						d={ringPath}
						fill="none"
						class="stroke-surface-700/50"
						stroke-width={innerStrokeWidth}
						stroke-linecap="round"
						style="opacity: {animatedOpacity};"
					/>

					<!-- Progress arc -->
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
				{/each}
			</svg>
		</div>
	</div>
</div>
