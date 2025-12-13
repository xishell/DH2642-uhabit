/**
 * Shared seed data generation for habits and completions.
 * Used by tests and D1 seeding scripts.
 */

import type { Habit, HabitCompletion } from '$lib/types/habit';

type HabitConfig = {
	title: string;
	frequency: Habit['frequency'];
	measurement: Habit['measurement'];
	period?: number[];
	targetAmount?: number;
	unit?: string;
};

type GoalConfig = {
	title: string;
	description?: string;
	durationDays: number;
	/** Habit titles that should be attached to this goal */
	habitTitles: string[];
	/** Optional offset (days ago) to start the goal; defaults to 0 (ends today) */
	startOffsetDays?: number;
};

type ScenarioConfig = {
	habits: HabitConfig[];
	completionRates: number[];
	days: number;
	includeGaps: boolean;
	goals: GoalConfig[];
};

// Scenario configurations
const SCENARIOS = {
	// Realistic user with mixed habits
	realistic: {
		habits: [
			{
				title: 'Drink water',
				frequency: 'daily',
				measurement: 'numeric',
				targetAmount: 8,
				unit: 'glasses'
			},
			{ title: 'Exercise', frequency: 'weekly', period: [1, 3, 5], measurement: 'boolean' },
			{
				title: 'Read',
				frequency: 'daily',
				measurement: 'numeric',
				targetAmount: 30,
				unit: 'minutes'
			},
			{ title: 'Meditation', frequency: 'daily', measurement: 'boolean' },
			{ title: 'Journal', frequency: 'daily', measurement: 'boolean' }
		],
		completionRates: [0.9, 0.7, 0.6, 0.5, 0.4], // Per habit
		days: 90,
		includeGaps: true,
		goals: [
			{
				title: 'Healthy Basics',
				description: 'Stay hydrated and active most days',
				durationDays: 45,
				habitTitles: ['Drink water', 'Exercise', 'Meditation']
			},
			{
				title: 'Mindful Evenings',
				description: 'Wind down with reading and journaling',
				durationDays: 30,
				habitTitles: ['Read', 'Journal']
			}
		]
	},

	// Perfect user - 100% completion
	perfect: {
		habits: [
			{ title: 'Morning routine', frequency: 'daily', measurement: 'boolean' },
			{ title: 'Workout', frequency: 'daily', measurement: 'boolean' },
			{
				title: 'Study',
				frequency: 'daily',
				measurement: 'numeric',
				targetAmount: 60,
				unit: 'minutes'
			}
		],
		completionRates: [1, 1, 1],
		days: 30,
		includeGaps: false,
		goals: [
			{
				title: 'Momentum Month',
				description: 'Keep perfect streaks across morning, workout, and study',
				durationDays: 30,
				habitTitles: ['Morning routine', 'Workout', 'Study']
			}
		]
	},

	// Struggling user - low completion
	struggling: {
		habits: [
			{ title: 'Wake up early', frequency: 'daily', measurement: 'boolean' },
			{ title: 'No social media', frequency: 'daily', measurement: 'boolean' },
			{ title: 'Exercise', frequency: 'daily', measurement: 'boolean' }
		],
		completionRates: [0.2, 0.15, 0.1],
		days: 60,
		includeGaps: true,
		goals: [
			{
				title: 'Reset Routine',
				description: 'Focus on mornings and reducing doom scrolling',
				durationDays: 21,
				habitTitles: ['Wake up early', 'No social media', 'Exercise']
			}
		]
	},

	// Long history - stress test
	longHistory: {
		habits: [
			{ title: 'Daily habit 1', frequency: 'daily', measurement: 'boolean' },
			{ title: 'Daily habit 2', frequency: 'daily', measurement: 'boolean' },
			{ title: 'Weekly habit', frequency: 'weekly', period: [1, 4], measurement: 'boolean' },
			{ title: 'Monthly habit', frequency: 'monthly', period: [1, 15], measurement: 'boolean' }
		],
		completionRates: [0.8, 0.6, 0.7, 0.9],
		days: 365,
		includeGaps: true,
		goals: [
			{
				title: 'Year of Consistency',
				description: 'Maintain daily and weekly cadence for a full year',
				durationDays: 180,
				startOffsetDays: 30,
				habitTitles: ['Daily habit 1', 'Daily habit 2', 'Weekly habit']
			}
		]
	},

	// Edge case - new user
	newUser: {
		habits: [{ title: 'First habit', frequency: 'daily', measurement: 'boolean' }],
		completionRates: [0.5],
		days: 3,
		includeGaps: false,
		goals: [
			{
				title: 'First week',
				description: 'Kick off the very first habit',
				durationDays: 7,
				habitTitles: ['First habit']
			}
		]
	},

	// Empty - no data
	empty: {
		habits: [],
		completionRates: [],
		days: 0,
		includeGaps: false,
		goals: []
	}
} satisfies Record<string, ScenarioConfig>;

export type ScenarioName = keyof typeof SCENARIOS;

/**
 * Generate a UUID-like ID
 */
function generateId(): string {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
		const r = (Math.random() * 16) | 0;
		const v = c === 'x' ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}

/**
 * Generate habits from scenario config
 */
function generateHabits(scenario: (typeof SCENARIOS)[ScenarioName]): Habit[] {
	const now = new Date();

	return (scenario.habits as HabitConfig[]).map((config) => ({
		id: generateId(),
		userId: 'test-user',
		title: config.title,
		notes: null,
		color: null,
		frequency: config.frequency as Habit['frequency'],
		measurement: config.measurement as Habit['measurement'],
		// Spread to convert readonly tuple types into mutable arrays expected by Habit
		period: Array.isArray(config.period) ? [...config.period] : null,
		targetAmount: config.targetAmount ?? null,
		unit: config.unit ?? null,
		categoryId: null,
		goalId: null,
		createdAt: new Date(now.getTime() - scenario.days * 24 * 60 * 60 * 1000),
		updatedAt: now
	}));
}

/**
 * Check if habit should show on date
 */
function shouldShowOnDate(habit: Habit, date: Date): boolean {
	if (habit.frequency === 'daily') return true;

	if (habit.frequency === 'weekly' && habit.period) {
		return habit.period.includes(date.getDay());
	}

	if (habit.frequency === 'monthly' && habit.period) {
		return habit.period.includes(date.getDate());
	}

	return true;
}

/**
 * Generate completions based on scenario
 */
function generateCompletions(
	habits: Habit[],
	scenario: (typeof SCENARIOS)[ScenarioName]
): HabitCompletion[] {
	const completions: HabitCompletion[] = [];
	const today = new Date();
	today.setHours(12, 0, 0, 0);

	for (let dayOffset = 0; dayOffset < scenario.days; dayOffset++) {
		const date = new Date(today);
		date.setDate(date.getDate() - dayOffset);

		// Add some variation for gaps
		const isGapDay = scenario.includeGaps && Math.random() < 0.05;

		habits.forEach((habit, habitIndex) => {
			if (!shouldShowOnDate(habit, date)) return;
			if (isGapDay) return; // Skip entire day sometimes

			const rate = scenario.completionRates[habitIndex] ?? 0.5;

			// Add time-based variation (better in mornings)
			const hourVariation = Math.sin((dayOffset % 7) * 0.5) * 0.1;
			const adjustedRate = Math.min(1, Math.max(0, rate + hourVariation));

			if (Math.random() < adjustedRate) {
				// Random hour between 6 AM and 10 PM
				const hour = 6 + Math.floor(Math.random() * 16);
				const completionDate = new Date(date);
				completionDate.setHours(hour, Math.floor(Math.random() * 60));

				const completion: HabitCompletion = {
					id: generateId(),
					habitId: habit.id,
					userId: 'test-user',
					completedAt: completionDate,
					measurement:
						habit.measurement === 'numeric'
							? Math.floor((habit.targetAmount ?? 10) * (0.8 + Math.random() * 0.4))
							: null,
					notes: null,
					createdAt: completionDate
				};

				completions.push(completion);
			}
		});
	}

	return completions;
}

type GeneratedGoal = {
	id: string;
	userId: string;
	title: string;
	description: string | null;
	startDate: Date;
	endDate: Date;
	createdAt: Date;
	updatedAt: Date;
	habitTitles: string[];
};

function generateGoals(
	scenario: (typeof SCENARIOS)[ScenarioName],
	habits: Habit[]
): { goals: GeneratedGoal[]; habitsWithGoals: Habit[] } {
	if (!scenario.goals || scenario.goals.length === 0) {
		return { goals: [], habitsWithGoals: habits };
	}

	const now = new Date();
	const goals: GeneratedGoal[] = (scenario.goals as GoalConfig[]).map((g) => {
		const endDate = new Date(now);
		endDate.setDate(endDate.getDate() - ((g.startOffsetDays as number | undefined) ?? 0));
		const startDate = new Date(endDate);
		startDate.setDate(startDate.getDate() - g.durationDays + 1);

		return {
			id: generateId(),
			userId: 'test-user',
			title: g.title,
			description: g.description ?? null,
			startDate,
			endDate,
			createdAt: startDate,
			updatedAt: endDate,
			habitTitles: [...g.habitTitles]
		};
	});

	// Attach goals to matching habits by title
	const habitsWithGoals = habits.map((h) => {
		const goal = goals.find((g) => g.habitTitles.includes(h.title));
		return goal ? { ...h, goalId: goal.id } : h;
	});

	return { goals, habitsWithGoals };
}

export function generateScenarioData(scenarioName: ScenarioName = 'realistic') {
	const scenario = SCENARIOS[scenarioName];
	if (!scenario) {
		throw new Error(
			`Unknown scenario: ${scenarioName}. Available: ${Object.keys(SCENARIOS).join(', ')}`
		);
	}

	const habits = generateHabits(scenario);
	const { goals, habitsWithGoals } = generateGoals(scenario, habits);
	const completions = generateCompletions(habitsWithGoals, scenario);

	return { scenarioName, scenario, habits: habitsWithGoals, completions, goals };
}

export function listScenarioNames(): string[] {
	return Object.keys(SCENARIOS);
}

export function describeScenario(name: ScenarioName): string {
	const scenario = SCENARIOS[name];
	return `${name}: ${scenario.habits.length} habits, ${scenario.days} days, rates: [${scenario.completionRates.join(', ')}]`;
}
