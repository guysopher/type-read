# Testing Guide for TypeRead

## Overview

TypeRead now has comprehensive unit test coverage using **Vitest** and **React Testing Library**. This guide will help you set up and run the tests.

## Setup

### Installing Dependencies

The testing dependencies should already be installed. If not, run:

```bash
npm install --save-dev vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

### Configuration Files

The test setup includes:
- `vitest.config.ts` - Vitest configuration
- `src/test/setup.ts` - Global test setup (mocks, etc.)

## Running Tests

### Basic Commands

```bash
# Run all tests once
npm test

# Run tests in watch mode (auto-rerun on file changes)
npm test -- --watch

# Run tests with UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

### Running Specific Tests

```bash
# Run a specific test file
npm test typingComparison.test.ts

# Run tests matching a pattern
npm test -- --grep "streak"

# Run only tests in a specific describe block
npm test -- --grep "addWordScore"
```

## Test Coverage

### Current Test Files

1. **src/utils/typingComparison.test.ts** - Typing validation logic (~80 tests)
2. **src/utils/fingerHints.test.ts** - Finger hint system (~40 tests)
3. **src/lib/storage.test.ts** - Storage and persistence (~100 tests)
4. **src/lib/gamification.test.ts** - Achievements and leveling (~80 tests)
5. **src/lib/sounds.test.ts** - Audio system (~40 tests)
6. **src/hooks/useGameScoring.test.ts** - Scoring system (~50 tests)

**Total: 390+ test cases covering all core business logic**

### Coverage Reports

After running `npm run test:coverage`, view the HTML report:

```bash
open coverage/index.html
```

The report shows:
- Line coverage
- Branch coverage
- Function coverage
- Uncovered lines

## Writing New Tests

### Test File Structure

Create test files alongside the code they test:

```
src/
  utils/
    myUtil.ts
    myUtil.test.ts  ← Test file
```

### Basic Test Template

```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from './myUtil';

describe('myFunction', () => {
  it('should do something', () => {
    // Arrange
    const input = 'test';

    // Act
    const result = myFunction(input);

    // Assert
    expect(result).toBe('expected');
  });
});
```

### Testing React Hooks

```typescript
import { renderHook, act } from '@testing-library/react';
import { useMyHook } from './useMyHook';

it('should update state', () => {
  const { result } = renderHook(() => useMyHook());

  act(() => {
    result.current.updateValue('new');
  });

  expect(result.current.value).toBe('new');
});
```

### Testing React Components

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { MyComponent } from './MyComponent';

it('should handle click', () => {
  render(<MyComponent />);

  const button = screen.getByRole('button');
  fireEvent.click(button);

  expect(screen.getByText('Clicked')).toBeInTheDocument();
});
```

## Mocking

### localStorage

localStorage is automatically mocked in `src/test/setup.ts`. It's reset before each test.

```typescript
it('should save to localStorage', () => {
  localStorage.setItem('key', 'value');
  expect(localStorage.getItem('key')).toBe('value');
});
```

### Web Audio API

Web Audio API is mocked globally. Access mocks like this:

```typescript
import { vi } from 'vitest';

it('should play sound', () => {
  const mockPlay = vi.fn();
  global.Audio = vi.fn(() => ({ play: mockPlay })) as any;

  playSound();
  expect(mockPlay).toHaveBeenCalled();
});
```

### Custom Mocks

Create mocks for complex dependencies:

```typescript
vi.mock('./myModule', () => ({
  myFunction: vi.fn(() => 'mocked result')
}));
```

## Debugging Tests

### Using console.log

```typescript
it('should debug', () => {
  const result = myFunction();
  console.log('Result:', result); // Will show in test output
  expect(result).toBe('expected');
});
```

### Running Single Test

Add `.only` to run just one test:

```typescript
it.only('should debug this specific test', () => {
  // Only this test will run
});
```

### Skipping Tests

Skip tests temporarily with `.skip`:

```typescript
it.skip('should skip this test', () => {
  // This test won't run
});
```

## Common Test Patterns

### Testing Error Handling

```typescript
it('should handle errors gracefully', () => {
  expect(() => {
    myFunction(invalidInput);
  }).toThrow('Expected error message');
});
```

### Testing Async Code

```typescript
it('should handle async operations', async () => {
  const result = await myAsyncFunction();
  expect(result).toBe('expected');
});
```

### Testing Timers

```typescript
import { vi } from 'vitest';

it('should handle timeouts', () => {
  vi.useFakeTimers();

  myFunctionWithTimeout();

  vi.advanceTimersByTime(1000);

  expect(result).toBe('after timeout');

  vi.restoreAllMocks();
});
```

## Best Practices

### 1. Test Behavior, Not Implementation

❌ **Bad:**
```typescript
it('should call internal method', () => {
  expect(obj._internalMethod).toHaveBeenCalled();
});
```

✅ **Good:**
```typescript
it('should update score when word is completed', () => {
  addWord('test', true);
  expect(getScore()).toBe(10);
});
```

### 2. Use Descriptive Test Names

❌ **Bad:**
```typescript
it('works', () => { ... });
```

✅ **Good:**
```typescript
it('should increase streak when word is typed correctly', () => { ... });
```

### 3. One Assertion Per Test (When Possible)

❌ **Bad:**
```typescript
it('should do everything', () => {
  expect(score).toBe(10);
  expect(streak).toBe(5);
  expect(combo).toBe(3);
  expect(powerUps).toHaveLength(2);
});
```

✅ **Good:**
```typescript
it('should update score', () => {
  expect(score).toBe(10);
});

it('should update streak', () => {
  expect(streak).toBe(5);
});
```

### 4. Test Edge Cases

Always test:
- Empty inputs
- Null/undefined
- Boundary values (0, -1, MAX_INT)
- Special characters
- Error conditions

### 5. Clean Up After Tests

```typescript
beforeEach(() => {
  // Set up
});

afterEach(() => {
  // Clean up
  vi.restoreAllMocks();
  localStorage.clear();
});
```

## Continuous Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm test -- --run
      - run: npm run test:coverage
```

## Troubleshooting

### Tests Not Running

1. Check that dependencies are installed:
   ```bash
   npm install
   ```

2. Verify vitest is installed:
   ```bash
   ls node_modules/.bin/vitest
   ```

3. Check for syntax errors:
   ```bash
   npm run lint
   ```

### Mock Not Working

1. Ensure mock is defined before import:
   ```typescript
   vi.mock('./module');
   import { function } from './module'; // Import after mock
   ```

2. Check that mock is reset between tests:
   ```typescript
   afterEach(() => {
     vi.restoreAllMocks();
   });
   ```

### Coverage Not Accurate

1. Run with explicit coverage flag:
   ```bash
   npm test -- --coverage
   ```

2. Check coverage configuration in `vitest.config.ts`

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Best Practices](https://testingjavascript.com/)

## Getting Help

If you encounter issues:
1. Check this documentation
2. Review existing test files for examples
3. See `TEST_COVERAGE.md` for detailed coverage info
4. Check Vitest docs for advanced features

---

**Happy Testing! 🧪**
