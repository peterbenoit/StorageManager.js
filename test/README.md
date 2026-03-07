# StorageManager.js Tests

This directory contains test suites for validating StorageManager.js functionality.

## Test Files

- **StorageManager.test.js** — Jest/Mocha compatible test suite for Node.js
- **test-runner.html** — Browser-based test runner with visual interface

## Running Tests

### Browser Tests (Recommended)

Open `test-runner.html` in your browser:

```bash
# From project root
open test/test-runner.html

# Or serve it locally
python -m http.server 8000
# Then visit http://localhost:8000/test/test-runner.html
```

Click "Run All Tests" to execute the test suite. Results display with pass/fail status and detailed error messages.

### Node.js Tests (With Jest)

First, install Jest if you haven't:

```bash
npm install --save-dev jest
```

Add to `package.json`:

```json
{
  "scripts": {
    "test": "jest"
  },
  "jest": {
    "testEnvironment": "node"
  }
}
```

Run tests:

```bash
npm test
```

## Test Coverage

### Basic Operations
- ✅ Set and get values (strings, objects, arrays, primitives)
- ✅ Remove items
- ✅ Handle non-existent keys
- ✅ Error handling for invalid data

### Compression
- ✅ Store and retrieve with compression enabled
- ✅ Store and retrieve with compression disabled
- ✅ Validate compressed data format

### Namespace
- ✅ Isolate keys by namespace
- ✅ Verify namespace prefixing
- ✅ Multiple instances with different namespaces

### Expiration
- ✅ Set expiration on existing items
- ✅ Apply default expiration automatically
- ✅ Verify items expire after timeout
- ✅ Ensure items don't expire without expiration set

### Key Operations
- ✅ `has()` — Check key existence
- ✅ `keys()` — List all keys in namespace
- ✅ `getAll()` — Retrieve all key-value pairs
- ✅ Exclude expired items from results

### Batch Operations
- ✅ `batchSet()` — Set multiple items at once
- ✅ `batchSet()` with expiration
- ✅ `batchGet()` — Retrieve multiple items
- ✅ `batchRemove()` — Remove multiple items
- ✅ Handle mixed existent/non-existent keys

### Event Listeners
- ✅ Register listeners with `onChange()`
- ✅ Unregister listeners with `offChange()`
- ✅ Handle namespace in listeners

### Cleanup
- ✅ Remove expired items
- ✅ Handle iteration correctly with multiple items
- ✅ Preserve non-expired items

### Edge Cases
- ✅ Empty strings
- ✅ Zero values
- ✅ False values
- ✅ Special characters in keys
- ✅ Large objects
- ✅ Deeply nested objects
- ✅ Removing non-existent keys
- ✅ Compression mode compatibility

## Test Structure

Tests are organized by feature area:

```
StorageManager
├── Constructor & Initialization
├── Basic Operations (Compression Disabled)
├── Basic Operations (Compression Enabled)
├── Namespace Functionality
├── Expiration Functionality
├── has() - Key Existence Check
├── keys() - List All Keys
├── getAll() - Retrieve All Data
├── Batch Operations
│   ├── batchSet()
│   ├── batchGet()
│   └── batchRemove()
├── clear()
├── cleanup()
├── Event Listeners
├── Edge Cases & Error Handling
└── Compression Mode Compatibility
```

## Adding New Tests

### Browser Tests

Add to `test-runner.html`:

```javascript
testSuites['Your Feature'] = [
    { 
        name: 'Your test name', 
        test: async function() {
            // Your test code
            const storage = new StorageManager();
            await storage.set('key', 'value');
            if (await storage.get('key') !== 'value') {
                throw new Error('Test failed');
            }
        }
    }
];
```

### Node.js Tests

Add to `StorageManager.test.js`:

```javascript
describe('Your Feature', () => {
    test('should do something', async () => {
        const storage = new StorageManager();
        await storage.set('key', 'value');
        expect(await storage.get('key')).toBe('value');
    });
});
```

## Continuous Integration

To run tests in CI:

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm test
```

## Notes

- Tests clear localStorage/sessionStorage before each test
- Expiration tests use short timeouts (1-2 seconds) for speed
- Browser tests require a browser environment
- Node.js tests use mocks for localStorage and LZString

## Troubleshooting

**Browser tests not working?**
- Ensure StorageManager.js is loaded before tests
- Check browser console for errors
- Verify LZString CDN is accessible

**Jest tests failing?**
- Make sure global mocks are set up (localStorage, LZString)
- Check that async/await is used correctly
- Verify Node.js version supports ES6+ features
