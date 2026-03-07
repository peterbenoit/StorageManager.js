/**
 * StorageManager.js Test Suite
 * 
 * Tests cover:
 * - Basic CRUD operations
 * - Compression enabled/disabled
 * - Expiration functionality
 * - Batch operations
 * - Namespace isolation
 * - Event listeners
 * - Edge cases and error handling
 */

// Mock localStorage and sessionStorage for testing
class MockStorage {
	constructor() {
		this.store = {};
	}

	getItem(key) {
		return this.store[key] || null;
	}

	setItem(key, value) {
		this.store[key] = value;
	}

	removeItem(key) {
		delete this.store[key];
	}

	clear() {
		this.store = {};
	}

	get length() {
		return Object.keys(this.store).length;
	}

	key(index) {
		const keys = Object.keys(this.store);
		return keys[index] || null;
	}
}

// Mock LZString for compression tests
const mockLZString = {
	compressToUTF16: (str) => `compressed:${str}`,
	decompressFromUTF16: (str) => str.replace('compressed:', '')
};

// Setup global mocks
global.window = {
	localStorage: new MockStorage(),
	sessionStorage: new MockStorage(),
	addEventListener: () => { }
};
global.LZString = mockLZString;

// Test utilities
function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

function clearAllStorage() {
	global.window.localStorage.clear();
	global.window.sessionStorage.clear();
}

// ===== TEST SUITE =====

describe('StorageManager', () => {
	beforeEach(() => {
		clearAllStorage();
	});

	describe('Constructor & Initialization', () => {
		test('should create instance with localStorage by default', async () => {
			const storage = new StorageManager();
			expect(storage.storage).toBe(global.window.localStorage);
		});

		test('should use sessionStorage when specified', async () => {
			const storage = new StorageManager(true);
			expect(storage.storage).toBe(global.window.sessionStorage);
		});

		test('should set namespace from options', async () => {
			const storage = new StorageManager(false, { namespace: 'myApp' });
			expect(storage.namespace).toBe('myApp');
		});

		test('should enable compression by default', async () => {
			const storage = new StorageManager();
			expect(storage.enableCompression).toBe(true);
		});

		test('should disable compression when specified', async () => {
			const storage = new StorageManager(false, { enableCompression: false });
			expect(storage.enableCompression).toBe(false);
		});

		test('should accept default expiration settings', async () => {
			const storage = new StorageManager(false, {
				defaultExpiration: { session: 60, token: 3600 }
			});
			expect(storage.defaultExpiration).toEqual({ session: 60, token: 3600 });
		});
	});

	describe('Basic Operations (Compression Disabled)', () => {
		let storage;

		beforeEach(() => {
			storage = new StorageManager(false, { enableCompression: false });
		});

		test('should set and get a string value', async () => {
			await storage.set('name', 'Alice');
			const value = await storage.get('name');
			expect(value).toBe('Alice');
		});

		test('should set and get an object', async () => {
			const user = { name: 'Alice', age: 25, active: true };
			await storage.set('user', user);
			const value = await storage.get('user');
			expect(value).toEqual(user);
		});

		test('should set and get an array', async () => {
			const items = [1, 2, 3, 'four', { five: 5 }];
			await storage.set('items', items);
			const value = await storage.get('items');
			expect(value).toEqual(items);
		});

		test('should set and get numbers', async () => {
			await storage.set('count', 42);
			const value = await storage.get('count');
			expect(value).toBe(42);
		});

		test('should set and get booleans', async () => {
			await storage.set('isActive', true);
			const value = await storage.get('isActive');
			expect(value).toBe(true);
		});

		test('should set and get null', async () => {
			await storage.set('nullable', null);
			const value = await storage.get('nullable');
			expect(value).toBe(null);
		});

		test('should return null for non-existent keys', async () => {
			const value = await storage.get('nonexistent');
			expect(value).toBe(null);
		});

		test('should remove items', async () => {
			await storage.set('temp', 'value');
			await storage.remove('temp');
			const value = await storage.get('temp');
			expect(value).toBe(null);
		});

		test('should throw error for non-JSON-serializable values', async () => {
			const circular = {};
			circular.self = circular;
			await expect(storage.set('circular', circular)).rejects.toThrow();
		});
	});

	describe('Basic Operations (Compression Enabled)', () => {
		let storage;

		beforeEach(() => {
			storage = new StorageManager(false, { enableCompression: true });
		});

		test('should set and get with compression', async () => {
			const data = { name: 'Bob', data: 'Large data that benefits from compression' };
			await storage.set('compressed', data);
			const value = await storage.get('compressed');
			expect(value).toEqual(data);
		});

		test('should store compressed data in storage', async () => {
			await storage.set('test', { value: 'data' });
			const raw = global.window.localStorage.getItem('test');
			expect(raw).toContain('compressed:');
		});
	});

	describe('Namespace Functionality', () => {
		test('should isolate keys by namespace', async () => {
			const storage1 = new StorageManager(false, { namespace: 'app1', enableCompression: false });
			const storage2 = new StorageManager(false, { namespace: 'app2', enableCompression: false });

			await storage1.set('key', 'value1');
			await storage2.set('key', 'value2');

			const value1 = await storage1.get('key');
			const value2 = await storage2.get('key');

			expect(value1).toBe('value1');
			expect(value2).toBe('value2');
		});

		test('should prefix keys with namespace', async () => {
			const storage = new StorageManager(false, { namespace: 'myApp', enableCompression: false });
			await storage.set('test', 'value');

			const raw = global.window.localStorage.getItem('myApp:test');
			expect(raw).not.toBe(null);
		});
	});

	describe('Expiration Functionality', () => {
		let storage;

		beforeEach(() => {
			storage = new StorageManager(false, { enableCompression: false });
		});

		test('should set expiration on existing items', async () => {
			await storage.set('temp', 'value');
			await storage.expires('temp', 2); // 2 seconds

			const value1 = await storage.get('temp');
			expect(value1).toBe('value');

			await sleep(2100);

			const value2 = await storage.get('temp');
			expect(value2).toBe(null);
		});

		test('should apply default expiration automatically', async () => {
			const storage = new StorageManager(false, {
				enableCompression: false,
				defaultExpiration: { session: 1 } // 1 second
			});

			await storage.set('session', 'data');

			const value1 = await storage.get('session');
			expect(value1).toBe('data');

			await sleep(1100);

			const value2 = await storage.get('session');
			expect(value2).toBe(null);
		});

		test('should not expire items without expiration set', async () => {
			await storage.set('permanent', 'value');
			await sleep(1000);
			const value = await storage.get('permanent');
			expect(value).toBe('value');
		});
	});

	describe('has() - Key Existence Check', () => {
		let storage;

		beforeEach(() => {
			storage = new StorageManager(false, { enableCompression: false });
		});

		test('should return true for existing keys', async () => {
			await storage.set('exists', 'value');
			const exists = await storage.has('exists');
			expect(exists).toBe(true);
		});

		test('should return false for non-existent keys', async () => {
			const exists = await storage.has('nonexistent');
			expect(exists).toBe(false);
		});

		test('should return false for expired keys', async () => {
			await storage.set('temp', 'value');
			await storage.expires('temp', 1);
			await sleep(1100);
			const exists = await storage.has('temp');
			expect(exists).toBe(false);
		});
	});

	describe('keys() - List All Keys', () => {
		let storage;

		beforeEach(() => {
			storage = new StorageManager(false, { namespace: 'test', enableCompression: false });
		});

		test('should return empty array when no keys exist', async () => {
			const keys = await storage.keys();
			expect(keys).toEqual([]);
		});

		test('should return all keys in namespace', async () => {
			await storage.set('key1', 'value1');
			await storage.set('key2', 'value2');
			await storage.set('key3', 'value3');

			const keys = await storage.keys();
			expect(keys.sort()).toEqual(['key1', 'key2', 'key3'].sort());
		});

		test('should only return keys from own namespace', async () => {
			const storage1 = new StorageManager(false, { namespace: 'app1', enableCompression: false });
			const storage2 = new StorageManager(false, { namespace: 'app2', enableCompression: false });

			await storage1.set('key1', 'value1');
			await storage2.set('key2', 'value2');

			const keys1 = await storage1.keys();
			const keys2 = await storage2.keys();

			expect(keys1).toEqual(['key1']);
			expect(keys2).toEqual(['key2']);
		});
	});

	describe('getAll() - Retrieve All Data', () => {
		let storage;

		beforeEach(() => {
			storage = new StorageManager(false, { enableCompression: false });
		});

		test('should return empty object when no data exists', async () => {
			const all = await storage.getAll();
			expect(all).toEqual({});
		});

		test('should return all key-value pairs', async () => {
			await storage.set('name', 'Alice');
			await storage.set('age', 25);
			await storage.set('active', true);

			const all = await storage.getAll();
			expect(all).toEqual({
				name: 'Alice',
				age: 25,
				active: true
			});
		});

		test('should exclude expired items', async () => {
			await storage.set('permanent', 'value1');
			await storage.set('temporary', 'value2');
			await storage.expires('temporary', 1);

			await sleep(1100);

			const all = await storage.getAll();
			expect(all).toEqual({ permanent: 'value1' });
		});
	});

	describe('Batch Operations', () => {
		let storage;

		beforeEach(() => {
			storage = new StorageManager(false, { enableCompression: false });
		});

		describe('batchSet()', () => {
			test('should set multiple items at once', async () => {
				await storage.batchSet([
					{ key: 'key1', value: 'value1' },
					{ key: 'key2', value: 'value2' },
					{ key: 'key3', value: 'value3' }
				]);

				expect(await storage.get('key1')).toBe('value1');
				expect(await storage.get('key2')).toBe('value2');
				expect(await storage.get('key3')).toBe('value3');
			});

			test('should set multiple items with expiration', async () => {
				await storage.batchSet([
					{ key: 'temp1', value: 'value1', expiresIn: 1 },
					{ key: 'temp2', value: 'value2', expiresIn: 1 },
					{ key: 'permanent', value: 'value3' }
				]);

				expect(await storage.get('temp1')).toBe('value1');

				await sleep(1100);

				expect(await storage.get('temp1')).toBe(null);
				expect(await storage.get('temp2')).toBe(null);
				expect(await storage.get('permanent')).toBe('value3');
			});
		});

		describe('batchGet()', () => {
			test('should retrieve multiple items at once', async () => {
				await storage.set('key1', 'value1');
				await storage.set('key2', 'value2');
				await storage.set('key3', 'value3');

				const result = await storage.batchGet(['key1', 'key2', 'key3']);
				expect(result).toEqual({
					key1: 'value1',
					key2: 'value2',
					key3: 'value3'
				});
			});

			test('should return null for non-existent keys', async () => {
				await storage.set('exists', 'value');

				const result = await storage.batchGet(['exists', 'missing']);
				expect(result).toEqual({
					exists: 'value',
					missing: null
				});
			});
		});

		describe('batchRemove()', () => {
			test('should remove multiple items at once', async () => {
				await storage.set('key1', 'value1');
				await storage.set('key2', 'value2');
				await storage.set('key3', 'value3');

				await storage.batchRemove(['key1', 'key2']);

				expect(await storage.get('key1')).toBe(null);
				expect(await storage.get('key2')).toBe(null);
				expect(await storage.get('key3')).toBe('value3');
			});
		});
	});

	describe('clear()', () => {
		test('should remove all items from storage', async () => {
			const storage = new StorageManager(false, { enableCompression: false });

			await storage.set('key1', 'value1');
			await storage.set('key2', 'value2');

			await storage.clear();

			expect(await storage.get('key1')).toBe(null);
			expect(await storage.get('key2')).toBe(null);
		});
	});

	describe('cleanup()', () => {
		let storage;

		beforeEach(() => {
			storage = new StorageManager(false, { enableCompression: false });
		});

		test('should remove expired items', async () => {
			await storage.set('expired1', 'value1');
			await storage.set('expired2', 'value2');
			await storage.set('valid', 'value3');

			await storage.expires('expired1', 1);
			await storage.expires('expired2', 1);

			await sleep(1100);

			await storage.cleanup();

			expect(await storage.get('expired1')).toBe(null);
			expect(await storage.get('expired2')).toBe(null);
			expect(await storage.get('valid')).toBe('value3');
		});

		test('should handle cleanup with multiple items correctly', async () => {
			// Test the fix for iteration bug
			for (let i = 0; i < 10; i++) {
				await storage.set(`temp${i}`, `value${i}`);
				await storage.expires(`temp${i}`, 1);
			}

			await storage.set('permanent', 'should-remain');

			await sleep(1100);
			await storage.cleanup();

			// All temp items should be gone
			for (let i = 0; i < 10; i++) {
				expect(await storage.get(`temp${i}`)).toBe(null);
			}

			// Permanent should still exist
			expect(await storage.get('permanent')).toBe('should-remain');
		});
	});

	describe('Event Listeners', () => {
		let storage;

		beforeEach(() => {
			storage = new StorageManager(false, { enableCompression: false });
		});

		test('should register onChange listener', async () => {
			let callbackCalled = false;

			storage.onChange('watched', (newValue, oldValue) => {
				callbackCalled = true;
			});

			expect(storage.listeners['watched']).toBeDefined();
		});

		test('should unregister onChange listener with offChange', async () => {
			storage.onChange('watched', () => { });
			expect(storage.listeners['watched']).toBeDefined();

			storage.offChange('watched');
			expect(storage.listeners['watched']).toBeUndefined();
		});

		test('should handle namespace in listeners', async () => {
			const storage = new StorageManager(false, {
				namespace: 'myApp',
				enableCompression: false
			});

			storage.onChange('key', () => { });
			expect(storage.listeners['myApp:key']).toBeDefined();
		});
	});

	describe('Edge Cases & Error Handling', () => {
		let storage;

		beforeEach(() => {
			storage = new StorageManager(false, { enableCompression: false });
		});

		test('should handle empty string values', async () => {
			await storage.set('empty', '');
			expect(await storage.get('empty')).toBe('');
		});

		test('should handle zero as value', async () => {
			await storage.set('zero', 0);
			expect(await storage.get('zero')).toBe(0);
		});

		test('should handle false as value', async () => {
			await storage.set('false', false);
			expect(await storage.get('false')).toBe(false);
		});

		test('should handle special characters in keys', async () => {
			await storage.set('key-with-special_chars.123', 'value');
			expect(await storage.get('key-with-special_chars.123')).toBe('value');
		});

		test('should handle large objects', async () => {
			const large = { data: 'x'.repeat(10000) };
			await storage.set('large', large);
			expect(await storage.get('large')).toEqual(large);
		});

		test('should handle deeply nested objects', async () => {
			const nested = {
				level1: {
					level2: {
						level3: {
							value: 'deep'
						}
					}
				}
			};
			await storage.set('nested', nested);
			expect(await storage.get('nested')).toEqual(nested);
		});

		test('should handle removing non-existent keys gracefully', async () => {
			await storage.remove('nonexistent');
			// Should not throw error
		});

		test('should handle expiring non-existent keys gracefully', async () => {
			// Should log error but not throw
			await storage.expires('nonexistent', 60);
		});
	});

	describe('Compression Mode Compatibility', () => {
		test('should not mix compressed and uncompressed data', async () => {
			const storage1 = new StorageManager(false, { enableCompression: true });
			const storage2 = new StorageManager(false, { enableCompression: false });

			await storage1.set('compressed', { data: 'test' });

			// storage2 trying to read compressed data should handle gracefully
			const value = await storage2.get('compressed');
			// May return null or garbled data, but shouldn't crash
			expect(value).toBeDefined();
		});
	});
});

// Export for use in test runners
if (typeof module !== 'undefined' && module.exports) {
	module.exports = { MockStorage, mockLZString };
}
