# Test Setup Directory

This directory contains global test configuration and setup files for the TypeRead testing suite.

## Files

### setup.ts
Global test setup file that runs before all tests.

**What it does:**
- Configures global test lifecycle hooks (beforeEach, afterEach)
- Mocks localStorage and sessionStorage
- Mocks Web Audio API (AudioContext, oscillators, gain nodes)
- Mocks HTML Audio elements
- Mocks matchMedia for responsive design tests
- Automatically cleans up after each test

**Mocks provided:**
```typescript
// Storage
global.localStorage - Full localStorage mock
global.sessionStorage - Full sessionStorage mock

// Audio
global.AudioContext - Web Audio API mock
global.Audio - HTML Audio element mock

// Browser APIs
window.matchMedia - Media query mock
```

## How Tests Use This Setup

All test files automatically inherit these mocks:

```typescript
// In any test file
import { describe, it, expect } from 'vitest';

describe('my test', () => {
  it('should have mocked localStorage', () => {
    localStorage.setItem('key', 'value');
    expect(localStorage.getItem('key')).toBe('value');
    // localStorage is automatically cleared after each test
  });
});
```

## Adding New Global Mocks

To add a new global mock:

1. Add it to `setup.ts`
2. Document it in this README
3. Ensure it has proper cleanup in `afterEach`

Example:
```typescript
// In setup.ts
afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
  // Add your cleanup here
});
```

## Test Organization

Tests are located alongside the code they test:

```
/src
  /utils
    myUtil.ts
    myUtil.test.ts      ← Test file
  /lib
    myLib.ts
    myLib.test.ts       ← Test file
  /hooks
    useMyHook.ts
    useMyHook.test.ts   ← Test file
  /components
    MyComponent.tsx
    MyComponent.test.tsx ← Test file
```

## Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific file
npm test myUtil.test.ts

# Watch mode
npm test -- --watch
```

## Test Patterns

### For Utilities
```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from './myUtil';

describe('myFunction', () => {
  it('should do something', () => {
    expect(myFunction('input')).toBe('output');
  });
});
```

### For Hooks
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

### For Components
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import MyComponent from './MyComponent';

it('should handle click', () => {
  render(<MyComponent />);

  fireEvent.click(screen.getByRole('button'));

  expect(screen.getByText('Clicked')).toBeInTheDocument();
});
```

## Troubleshooting

### Mock not working?
1. Check that it's defined in `setup.ts`
2. Verify it's imported in the test
3. Ensure cleanup is happening

### Test failing randomly?
1. Check for shared state
2. Verify cleanup is running
3. Look for async issues

### Can't find module?
1. Check path aliases in `vitest.config.ts`
2. Verify imports use correct paths
3. Ensure dependencies are installed

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Docs](https://testing-library.com/)
- Main testing guide: `/README_TESTING.md`
- Coverage details: `/TEST_COVERAGE.md`
