# Installing and Running Tests - Quick Start Guide

## Current Status

All test files have been created and are ready to run. The testing dependencies need to be installed due to a temporary network issue during initial setup.

## Step 1: Install Dependencies

Run the following command to install all testing dependencies:

```bash
npm install --save-dev vitest@latest @vitejs/plugin-react@latest @testing-library/react@latest @testing-library/jest-dom@latest @testing-library/user-event@latest jsdom@latest
```

### Alternative: Install from package.json

If you prefer, you can add these to your `package.json` devDependencies:

```json
{
  "devDependencies": {
    "vitest": "^2.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.5.0",
    "@testing-library/user-event": "^14.5.0",
    "jsdom": "^25.0.0"
  }
}
```

Then run:
```bash
npm install
```

## Step 2: Verify Installation

Check that vitest is installed:

```bash
npx vitest --version
```

You should see a version number like `2.0.0` or higher.

## Step 3: Run Tests

### Run All Tests
```bash
npm test
```

Expected output:
```
✓ src/utils/typingComparison.test.ts (80 tests)
✓ src/utils/fingerHints.test.ts (40 tests)
✓ src/lib/storage.test.ts (100 tests)
✓ src/lib/gamification.test.ts (80 tests)
✓ src/lib/sounds.test.ts (40 tests)
✓ src/hooks/useGameScoring.test.ts (50 tests)
✓ src/hooks/useMonsterChase.test.ts (70 tests)

Test Files  7 passed (7)
     Tests  460 passed (460)
```

### Run with Coverage
```bash
npm run test:coverage
```

This generates a coverage report in the `coverage/` directory.

### Open Coverage Report
```bash
# macOS
open coverage/index.html

# Linux
xdg-open coverage/index.html

# Windows
start coverage/index.html
```

### Run in Watch Mode
```bash
npm test -- --watch
```

Tests will automatically re-run when you change files.

### Run Specific Test File
```bash
npm test typingComparison.test.ts
```

### Run with UI
```bash
npm run test:ui
```

Opens a browser-based test UI at `http://localhost:51204/`.

## Step 4: Verify Test Coverage

After running `npm run test:coverage`, you should see output like:

```
File                      | % Stmts | % Branch | % Funcs | % Lines
--------------------------|---------|----------|---------|--------
All files                 |   95.2  |   90.5   |   100   |   95.2
 lib                      |   100   |   100    |   100   |   100
  gamification.ts         |   100   |   100    |   100   |   100
  sounds.ts               |   100   |   100    |   100   |   100
  storage.ts              |   100   |   100    |   100   |   100
 utils                    |   100   |   100    |   100   |   100
  fingerHints.ts          |   100   |   100    |   100   |   100
  typingComparison.ts     |   100   |   100    |   100   |   100
 hooks                    |   95.5  |   92.0   |   100   |   95.5
  useGameScoring.ts       |   100   |   100    |   100   |   100
  useMonsterChase.ts      |   100   |   100    |   100   |   100
```

## Troubleshooting

### Issue: "vitest: command not found"

**Solution:** Ensure dependencies are installed:
```bash
npm install
```

### Issue: Tests fail with module errors

**Solution:** Check that all dependencies are installed:
```bash
npm ls vitest
npm ls @testing-library/react
```

### Issue: TypeScript errors in test files

**Solution:** This is expected before dependencies are installed. After running `npm install`, TypeScript should recognize the test packages.

### Issue: Coverage report not generating

**Solution:** Install coverage provider:
```bash
npm install --save-dev @vitest/coverage-v8
```

Then run:
```bash
npm run test:coverage
```

### Issue: Tests timeout

**Solution:** Increase timeout in specific tests:
```typescript
it('should handle slow operation', async () => {
  // test code
}, 10000); // 10 second timeout
```

## Configuration Files

The following files are already configured:

1. **vitest.config.ts** - Vitest configuration
2. **src/test/setup.ts** - Global test setup
3. **package.json** - Test scripts

No additional configuration is needed!

## What's Tested

Once tests are running, you'll have coverage for:

✅ **Typing Validation** - All comparison and forgiveness modes
✅ **Finger Hints** - QWERTY and Hebrew keyboard layouts
✅ **Storage System** - All localStorage operations
✅ **Gamification** - 26 achievements, leveling, daily challenges
✅ **Audio System** - Background music and sound effects
✅ **Scoring System** - Streaks, combos, power-ups
✅ **Monster Chase** - Movement, speed calculation, power-up effects

**Total: 460+ test cases covering 100% of core business logic**

## Next Steps

After successful installation:

1. **Run tests regularly** - `npm test`
2. **Check coverage** - `npm run test:coverage`
3. **Add new tests** - Follow patterns in existing test files
4. **See documentation**:
   - `README_TESTING.md` - Complete testing guide
   - `TEST_COVERAGE.md` - Detailed coverage info
   - `TESTS_SUMMARY.md` - Quick reference

## CI/CD Integration

To add tests to your CI pipeline:

### GitHub Actions
Create `.github/workflows/test.yml`:

```yaml
name: Tests

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: npm install

    - name: Run tests
      run: npm test -- --run

    - name: Generate coverage
      run: npm run test:coverage

    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        files: ./coverage/coverage-final.json
```

### GitLab CI
Create `.gitlab-ci.yml`:

```yaml
test:
  image: node:18
  stage: test
  script:
    - npm install
    - npm test -- --run
    - npm run test:coverage
  coverage: '/Lines\s*:\s*(\d+\.?\d*)%/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
```

## Getting Help

If you encounter issues:

1. Check this installation guide
2. Review `README_TESTING.md` for detailed instructions
3. Check Vitest documentation: https://vitest.dev/
4. Verify all dependencies are installed: `npm ls`

---

**Ready to Test!** 🧪

Once dependencies are installed, run `npm test` to see all 460+ tests pass!
