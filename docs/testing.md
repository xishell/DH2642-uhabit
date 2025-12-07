# Testing Guide

This project uses [Vitest](https://vitest.dev/) for testing.

## Running Tests

```bash
# Run all tests once (CI mode)
bun run test

# Run tests in watch mode
bun run test:unit

# Run tests with coverage
bun run test -- --coverage
```

## Test Structure

Tests are organized in the `tests/` directory:

```
tests/
├── unit/                     # Unit tests for utilities and functions
│   └── date-utils.test.ts   # Date utility function tests
└── api/                      # API route validation tests
    └── habits.test.ts       # Habit API validation tests
```

## Test Examples

### Unit Test Example

Tests for utility functions (`tests/unit/date-utils.test.ts`):

```typescript
import { describe, it, expect } from 'vitest';
import { isToday, formatDate } from '$lib/utils/date';

describe('Date Utilities', () => {
	it('checks if date is today', () => {
		const now = new Date();
		expect(isToday(now)).toBe(true);
	});

	it('formats date as YYYY-MM-DD', () => {
		const date = new Date('2025-11-28');
		expect(formatDate(date)).toBe('2025-11-28');
	});
});
```

### API Validation Test Example

Tests for API route validation schemas (`tests/api/habits.test.ts`):

```typescript
import { describe, it, expect } from 'vitest';
import { habitSchema } from '$lib/schemas/habit';

describe('Habit API Validation', () => {
	it('validates a valid habit', () => {
		const input = { title: 'Drink water' };
		const result = habitSchema.safeParse(input);
		expect(result.success).toBe(true);
	});

	it('rejects invalid input', () => {
		const input = { title: '' };
		const result = habitSchema.safeParse(input);
		expect(result.success).toBe(false);
	});
});
```

## Test Coverage

The project is configured with test coverage reporting using V8. Coverage reports are generated in the following formats:

- **Text**: Displayed in terminal after running tests with `--coverage`
- **JSON**: `coverage/coverage-final.json`
- **HTML**: `coverage/index.html` (open in browser for detailed view)

To generate coverage reports:

```bash
bun test -- --coverage
```

## Configuration

### Main Test Config (`vite.config.ts`)

- **Environment**: Node (for unit and API tests)
- **Include**: `tests/**/*.{test,spec}.{js,ts}`
- **Exclude**: Component tests and Svelte files
- **Coverage**: V8 provider with text, JSON, and HTML reporters

## Writing Tests

### Example Test Structure

```typescript
import { describe, it, expect, beforeEach } from 'vitest';

describe('Feature Name', () => {
	// Setup if needed
	beforeEach(() => {
		// Setup code
	});

	describe('specific function', () => {
		it('does something expected', () => {
			// Arrange
			const input = 'test';

			// Act
			const result = someFunction(input);

			// Assert
			expect(result).toBe('expected');
		});

		it('handles error case', () => {
			// Test error conditions
			expect(() => someFunction(null)).toThrow();
		});
	});
});
```

## Continuous Integration

Test commands are ready for CI/CD integration:

```bash
# Run tests in CI mode (single run, no watch)
bun test
```

Ensure tests pass before:

- Committing code
- Creating pull requests
- Deploying to production

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Zod Validation](https://zod.dev/)
