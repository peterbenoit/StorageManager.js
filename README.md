# StorageManager.js

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fpeterbenoit%2FStorageManager.js)

StorageManager.js provides a convenient and feature-rich interface to handle localStorage and sessionStorage, offering additional features such as item expiration, batch operations, optional data compression, and storage events.

**✨ [View the Live Demo & Documentation](https://storage-manager-js.vercel.app/) ✨**

## Features

-   **localStorage and sessionStorage support**: Easily switch between the two storage types.
-   **Automatic expiration**: Set items to expire after a specified time.
-   **Batch operations**: Batch set or get multiple items at once.
-   **Optional LZString compression**: Optimize storage by compressing data.
-   **On-change listeners**: Track storage updates in real-time.
-   **Initial cleanup**: Automatically removes expired items upon initialization.
-   **Key existence check**: `has(key)` to verify a key exists and is not expired.
-   **Namespace key listing**: `keys()` to list all keys in the current namespace.
-   **Bulk removal**: `batchRemove(keys)` to remove multiple items at once.
-   **Unsubscribe listeners**: `offChange(key)` to remove change listeners for a key.

## Installation

### NPM Installation

```bash
npm install web-storage-manager-js
# or
yarn add web-storage-manager-js
```

```javascript
// Import in your project
import StorageManager from 'web-storage-manager-js';
```

### Direct Include

You can include StorageManager.js directly in your HTML:

```html
<!-- Include from CDN (replace x.y.z with the desired version) -->
<script src="https://cdn.jsdelivr.net/npm/web-storage-manager-js@x.y.z/StorageManager.js"></script>

<!-- Or download and include locally -->
<script src="path/to/StorageManager.js"></script>
```

## Basic Usage

To use the StorageManager, instantiate it with your choice of storage and options.

```javascript
// Create a localStorage manager with compression disabled
const localStorageManager = new StorageManager(false, {
    namespace: 'myApp',
    defaultExpiration: { userData: 60 }, // 60 seconds expiration
    enableCompression: false, // Disable compression
});

// Create a sessionStorage manager
const sessionStorageManager = new StorageManager(true, {
    namespace: 'mySessionApp',
});
```

## API

### Methods

-   `set(key, value)`: Store an item in storage.
-   `get(key)`: Retrieve an item by its key.
-   `remove(key)`: Remove an item from storage.
-   `expires(key, expiresIn)`: Set an expiration time (in seconds) for an item.
-   `batchSet(items)`: Batch set multiple key-value pairs at once.
-   `batchGet(keys)`: Batch retrieve multiple items at once.
-   `cleanup()`: Remove expired items from storage.
-   `onChange(key, callback)`: Set a listener for changes to the specified key.
-   `has(key)`: Check if a key exists and is not expired.
-   `keys()`: Get an array of all keys in the current namespace.
-   `getAll()`: Retrieve all key-value pairs in the current namespace.
-   `batchRemove(keys)`: Remove multiple keys at once.
-   `offChange(key)`: Unsubscribe from change events for a key.

## Example

Here’s a simple example to store and retrieve data:

```javascript
// Set user data with expiration
localStorageManager.set('userData', { name: 'John', age: 25 });
localStorageManager.expires('userData', 60); // Expires in 60 seconds

// Retrieve the data
const userData = localStorageManager.get('userData');
console.log(userData);
```

## Demo

A live interactive demo and full documentation can be found here, hosted on Vercel:

**[https://storage-manager-js.vercel.app/](https://storage-manager-js.vercel.app/)**

## Options

-   **namespace**: A string to prepend to each key in storage. Defaults to `""`.
-   **defaultExpiration**: An object mapping keys to expiration times in seconds.
-   **enableCompression**: A boolean to enable or disable LZString compression. Defaults to `true`.

## Testing

The library includes a comprehensive test suite with 50+ tests covering all features and edge cases.

### Running Tests

Run the terminal test suite:

```bash
npm test
```

Run a publish dry-run check (same check used by prepublish hook):

```bash
npm run pack:check
```

You can also use the browser-based test runner:

```bash
# Open the test runner in your browser
open test/test-runner.html
# or on Windows: start test/test-runner.html
```

The test suite validates:
- Basic storage operations (set, get, remove)
- Compression (on/off modes)
- Namespace isolation
- Expiration and cleanup
- Batch operations
- Change listeners and cross-tab events
- Edge cases and error handling

For more details on testing, see [test/README.md](test/README.md).

## Deployment

This project's documentation and demo page is deployed using [Vercel](https://vercel.com/). The configuration can be found in `vercel.json`.

## CDN Usage

Use a pinned version in production for predictable behavior:

```html
<script src="https://cdn.jsdelivr.net/npm/web-storage-manager-js@1.0.1/StorageManager.js"></script>
```

Latest version via jsDelivr:

```html
<script src="https://cdn.jsdelivr.net/npm/web-storage-manager-js/StorageManager.js"></script>
```

Pinned version via unpkg:

```html
<script src="https://unpkg.com/web-storage-manager-js@1.0.1/StorageManager.js"></script>
```

After loading via script tag, access the class from `window.StorageManager`.

## Release Steps

```bash
# 1) Confirm clean git status
git status --short

# 2) Run checks
npm test
npm run pack:check

# 3) Bump version and create tag/commit
npm version patch

# 4) Publish to npm
npm publish
```

## License

This project is licensed under the MIT License.

---

Created by [Peter Benoit](https://www.peterbenoit.com)
