# StorageManager.js — Technical Documentation

## Overview

**StorageManager.js** is a lightweight JavaScript library that wraps the browser's native `localStorage` and `sessionStorage` APIs with a richer, more reliable interface. It adds automatic data expiration, transparent LZString compression, batch operations, namespacing, cross-tab event listeners, and type-safe serialization — all without any required dependencies.

It is published to npm as [`web-storage-manager-js`](https://www.npmjs.com/package/web-storage-manager-js) and is available via CDN through jsDelivr and unpkg.

---

## Why It Was Created

The native Web Storage API is deliberately minimal. You get `setItem`, `getItem`, `removeItem`, and `clear` — nothing else. In practice, real-world applications need more:

- **Expiring data** — session tokens, UI flags, and cached responses all have a useful lifetime. The native API has no TTL concept; you end up rolling your own stale-check on every read.
- **Namespace isolation** — multiple apps or modules sharing the same origin can overwrite each other's keys. There is no built-in partitioning.
- **Storage limits** — `localStorage` is typically capped at 5 MB per origin. Large datasets quietly hit the quota limit and throw a `QuotaExceededError` with no warning.
- **Cross-tab synchronization** — the `storage` event fires in other tabs but the payload is a raw string; deserializing it consistently is boilerplate every project re-implements.
- **Batch operations** — reading or writing a set of related keys requires looping manually and handling errors piecemeal.

StorageManager.js consolidates all of these concerns into a single, consistent interface so that each project doesn't need to solve them from scratch.

---

## Target Audience

This library is aimed at **front-end developers and full-stack engineers** who:

- Build browser-based applications that persist state beyond a single page view.
- Need cache-like semantics (time-to-live) for data stored on the client.
- Work on multi-feature SPAs or micro-frontends where key collision in a shared storage namespace is a real concern.
- Want transparent compression to stay well under the browser's 5 MB storage quota when caching larger payloads (API responses, user content, etc.).
- Prefer a zero-footprint approach — include one script file, no bundler required, but also importable as an ES module via npm.

If you have ever written `JSON.parse(localStorage.getItem(...))` followed by a manual expiry timestamp check, this library is for you.

---

## Installation

### npm / yarn

```bash
npm install web-storage-manager-js
# or
yarn add web-storage-manager-js
```

```js
import StorageManager from 'web-storage-manager-js';
```

### CDN (pinned version — recommended for production)

```html
<script src="https://cdn.jsdelivr.net/npm/web-storage-manager-js@1.0.1/StorageManager.js"></script>
```

### CDN (latest)

```html
<script src="https://cdn.jsdelivr.net/npm/web-storage-manager-js/StorageManager.js"></script>
```

### Direct download

Download `StorageManager.js` from the [GitHub repository](https://github.com/peterbenoit/StorageManager.js) and include it with a `<script>` tag.

---

## Constructor

```js
new StorageManager(useSession?, options?)
```

| Parameter | Type | Default | Description |
|---|---|---|---|
| `useSession` | `boolean` | `false` | `true` = `sessionStorage`, `false` = `localStorage` |
| `options.namespace` | `string` | `""` | Prefix prepended to every key (`"ns:key"`). Isolates storage between apps or modules. |
| `options.defaultExpiration` | `object` | `{}` | Map of `{ keyName: seconds }`. When `set()` is called with a matching key, `expires()` is called automatically. |
| `options.enableCompression` | `boolean` | `true` | When `true`, values are compressed with LZString before writing. LZString is lazy-loaded from a CDN on first use. |

### Examples

```js
// localStorage, no namespace, compression on (default)
const store = new StorageManager();

// sessionStorage
const session = new StorageManager(true);

// localStorage with namespace and auto-expiration
const appStore = new StorageManager(false, {
  namespace: 'myApp',
  defaultExpiration: {
    authToken: 3600,   // 1 hour
    userPrefs: 86400,  // 24 hours
  },
  enableCompression: false,
});
```

> **Note:** The constructor returns a `Proxy` that automatically awaits LZString loading before any method call when compression is enabled. All public methods are therefore `async` and return Promises.

---

## API Reference

All methods are `async` and should be awaited.

---

### `set(key, value)`

Store a value. The value must be JSON-serializable. Throws if it is not.

```js
await store.set('user', { id: 1, name: 'Alice' });
await store.set('theme', 'dark');
await store.set('count', 42);
```

If `defaultExpiration` contains an entry for `key`, the expiration is applied automatically after the value is written.

---

### `get(key)`

Retrieve a value. Returns `null` if the key does not exist or has expired (expired items are also removed from storage on read).

```js
const user = await store.get('user');
// { id: 1, name: 'Alice' }  or  null
```

---

### `remove(key)`

Delete a key and cancel any pending expiration timer for it.

```js
await store.remove('user');
```

---

### `has(key)`

Returns `true` if the key exists and has not expired.

```js
if (await store.has('authToken')) {
  // proceed with authenticated request
}
```

---

### `expires(key, seconds)`

Set or update the TTL for an existing key. The item will be automatically removed after `seconds` seconds and any registered `onChange` listener will be notified.

```js
await store.set('cache', responseData);
await store.expires('cache', 300); // expire in 5 minutes
```

---

### `keys()`

Return an array of all keys currently stored under the active namespace (without the namespace prefix).

```js
const allKeys = await store.keys();
// ['user', 'theme', 'count']
```

---

### `getAll()`

Return all key-value pairs under the active namespace as a plain object.

```js
const snapshot = await store.getAll();
// { user: { id: 1, name: 'Alice' }, theme: 'dark', count: 42 }
```

---

### `batchSet(items)`

Write multiple key-value pairs in a single call. Each item may include an optional `expiresIn` field (seconds).

```js
await store.batchSet([
  { key: 'firstName', value: 'Alice' },
  { key: 'lastName',  value: 'Smith' },
  { key: 'sessionId', value: 'abc123', expiresIn: 1800 },
]);
```

---

### `batchGet(keys)`

Read multiple keys at once. Returns a plain object mapping each key to its value (or `null` if missing/expired).

```js
const result = await store.batchGet(['firstName', 'lastName', 'missing']);
// { firstName: 'Alice', lastName: 'Smith', missing: null }
```

---

### `batchRemove(keys)`

Remove an array of keys in one call.

```js
await store.batchRemove(['tempFlag', 'draftData', 'oldCache']);
```

---

### `onChange(key, callback)`

Register a listener that is called whenever `key` changes (set, updated, expired, or removed). The callback receives `(newValue, oldValue)`.

```js
store.onChange('cart', (newCart, oldCart) => {
  console.log('Cart updated:', newCart);
  updateCartBadge(newCart);
});
```

Changes in other browser tabs are also captured via the native `storage` event.

---

### `offChange(key)`

Unsubscribe the listener registered for `key`.

```js
store.offChange('cart');
```

---

### `cleanup()`

Scan all keys in the active namespace and remove any that have expired. This is called automatically on construction, but can be triggered manually if needed.

```js
await store.cleanup();
```

---

### `clear()`

Remove **all** entries from the underlying storage object (not scoped to the namespace).

```js
await store.clear();
```

---

## Compression

When `enableCompression: true` (the default), StorageManager uses [LZString](https://pieroxy.net/blog/pages/lz-string/index.html) to compress values before writing to storage. LZString is loaded lazily from a CDN the first time a method is called; subsequent calls use the already-loaded library.

**When to enable compression:**
- You are storing large objects (API responses, article bodies, datasets).
- You are approaching the browser's ~5 MB storage limit.

**When to disable compression:**
- You are storing small, simple values (flags, IDs, short strings).
- You are in a non-browser environment (e.g., Node.js / Jest) where loading a CDN script is not possible.
- You need the raw stored values to be human-readable in DevTools.

```js
// Compression off — values stored as plain JSON
const store = new StorageManager(false, { enableCompression: false });
```

> **Important:** Data written with compression enabled cannot be read back with compression disabled, and vice versa. Pick one mode per storage namespace and stick with it.

---

## Namespacing

The `namespace` option prepends a `"prefix:"` string to every key. This is useful when:

- Multiple independent modules share the same page and same origin.
- You want to `keys()` or `getAll()` only your own entries without filtering out unrelated data.
- You are migrating from a non-namespaced store without losing existing data.

```js
const storeA = new StorageManager(false, { namespace: 'moduleA' });
const storeB = new StorageManager(false, { namespace: 'moduleB' });

await storeA.set('config', { color: 'red' });
await storeB.set('config', { color: 'blue' });

// No collision — stored as "moduleA:config" and "moduleB:config" internally
console.log(await storeA.get('config')); // { color: 'red' }
console.log(await storeB.get('config')); // { color: 'blue' }
```

---

## Expiration

Expiration is stored as a Unix timestamp inside the serialized payload alongside the value. On every `get()` call, the timestamp is checked against `Date.now()`. If the item is stale, it is removed from storage and `null` is returned — no stale data is ever surfaced.

Additionally, a `setTimeout` is set when `expires()` is called. When the timer fires, the item is deleted and any `onChange` listener for that key is notified. This means reactive code (e.g., UI components watching a key) receives the expiry event proactively rather than only on the next read.

```js
await cache.set('prices', priceData);
await cache.expires('prices', 60); // remove in 60 seconds

// 61 seconds later...
await cache.get('prices'); // null — already removed
await cache.has('prices'); // false
```

---

## Cross-Tab Events

The native `storage` event fires in every tab that shares the same origin **except** the one that made the change. StorageManager wires into this event and delivers the decoded (and decompressed, if needed) values to any registered `onChange` listener, so your UI can react to changes made in another tab without polling.

```js
// Tab A
const store = new StorageManager(false, { namespace: 'app' });
store.onChange('notifications', (count) => {
  updateBadge(count); // called when Tab B writes this key
});

// Tab B
const store = new StorageManager(false, { namespace: 'app' });
await store.set('notifications', 5);
// Tab A's listener fires with newValue = 5
```

---

## Usage Patterns

### Caching an API Response

```js
const cache = new StorageManager(false, {
  namespace: 'apiCache',
  enableCompression: true,
  defaultExpiration: { products: 300 }, // 5 min
});

async function getProducts() {
  if (await cache.has('products')) {
    return cache.get('products');
  }
  const data = await fetch('/api/products').then(r => r.json());
  await cache.set('products', data); // auto-expires in 5 min
  return data;
}
```

### Auth Token with TTL

```js
const authStore = new StorageManager(false, {
  namespace: 'auth',
  enableCompression: false,
});

async function saveToken(token, expiresInSeconds) {
  await authStore.set('token', token);
  await authStore.expires('token', expiresInSeconds);
}

async function getToken() {
  return authStore.get('token'); // returns null if expired
}
```

### Persisting Form State

```js
const formStore = new StorageManager(true, { // sessionStorage
  namespace: 'form:checkout',
  enableCompression: false,
});

// Auto-save on input
inputEl.addEventListener('input', async () => {
  await formStore.set('step1', collectFormData());
});

// Restore on page load
const saved = await formStore.getAll();
if (saved.step1) restoreFormData(saved.step1);
```

---

## Testing

The library ships with a Jest test suite covering 50+ cases.

```bash
npm test
```

Coverage includes:

- Basic CRUD (`set`, `get`, `remove`)
- Compression on and off
- Namespace isolation
- Expiration and automatic cleanup
- Batch operations
- `onChange` / `offChange` listeners
- Cross-tab `storage` event handling
- Edge cases: invalid JSON, missing keys, decompression failure

A browser-based test runner is also available:

```bash
open test/test-runner.html
```

---

## License

MIT — see [LICENSE](LICENSE) for full text.

---

## Links

- **Live demo & docs:** [https://storage-manager-js.vercel.app/](https://storage-manager-js.vercel.app/)
- **npm package:** [https://www.npmjs.com/package/web-storage-manager-js](https://www.npmjs.com/package/web-storage-manager-js)
- **Source:** [https://github.com/peterbenoit/StorageManager.js](https://github.com/peterbenoit/StorageManager.js)
