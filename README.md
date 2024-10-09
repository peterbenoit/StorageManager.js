
# StorageManager.js

StorageManager.js provides a convenient and feature-rich interface to handle localStorage and sessionStorage, offering additional features such as item expiration, batch operations, optional data compression, and storage events.

## Features

- **localStorage and sessionStorage support**: Easily switch between the two storage types.
- **Automatic expiration**: Set items to expire after a specified time.
- **Batch operations**: Batch set or get multiple items at once.
- **Optional LZString compression**: Optimize storage by compressing data.
- **On-change listeners**: Track storage updates in real-time.
- **Easy-to-use API**: Simple methods to store, retrieve, and remove items from storage.

## Installation

You can include StorageManager.js in your project by downloading it or by linking it from your HTML page.

```html
<script src="path/to/StorageManager.js"></script>
```

## Basic Usage

To use the StorageManager, instantiate it with your choice of storage and options.

```javascript
// Create a localStorage manager with compression disabled
const localStorageManager = new StorageManager(false, {
    namespace: 'myApp',
    defaultExpiration: { userData: 60 }, // 60 seconds expiration
    enableCompression: false // Disable compression
});

// Create a sessionStorage manager
const sessionStorageManager = new StorageManager(true, {
    namespace: 'mySessionApp'
});
```

## API

### Methods

- `set(key, value)`: Store an item in storage.
- `get(key)`: Retrieve an item by its key.
- `remove(key)`: Remove an item from storage.
- `expires(key, expiresIn)`: Set an expiration time (in seconds) for an item.
- `batchSet(items)`: Batch set multiple key-value pairs at once.
- `batchGet(keys)`: Batch retrieve multiple items at once.
- `cleanup()`: Remove expired items from storage.
- `onChange(key, callback)`: Set a listener for changes to the specified key.

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

A demo of StorageManager.js can be found on [Codepen](https://codepen.io/peterbenoit/pen/qBeaaEO)

## Options

- **namespace**: A string to prepend to each key in storage. Defaults to `""`.
- **defaultExpiration**: An object mapping keys to expiration times in seconds.
- **enableCompression**: A boolean to enable or disable LZString compression. Defaults to `true`.

## License

This project is licensed under the MIT License.
