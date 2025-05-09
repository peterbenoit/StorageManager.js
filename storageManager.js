let scriptLoadedPromise = null;

async function include(url) {
	if (scriptLoadedPromise) {
		return scriptLoadedPromise;
	}

	scriptLoadedPromise = new Promise((resolve, reject) => {
		const script = document.createElement("script");
		script.src = url;
		script.async = true;

		script.onload = () => {
			console.log(`Library loaded from: ${url}`);
			resolve();
		};

		script.onerror = () => {
			console.error(`Failed to load library from: ${url}`);
			reject(new Error(`Failed to load script ${url}`));
		};

		document.head.appendChild(script);
	});

	return scriptLoadedPromise;
}

class StorageManager {
	constructor(useSession = false, options = {}) {
		this.storage = useSession ? window.sessionStorage : window.localStorage;
		this.namespace = options.namespace || "";
		this.defaultExpiration = options.defaultExpiration || {};
		this.listeners = {};
		this.expirationTimers = {};
		this.enableCompression = options.enableCompression ?? true;
		this.initStorageListener();
		// Perform initial cleanup of expired items (defer until LZString is loaded)
		if (this.enableCompression) {
			this._ensureLZStringLoaded()
				.then(() => this.cleanup())
				.catch(err => console.error('Error loading LZString for cleanup', err));
		} else {
			this.cleanup();
		}

		return new Proxy(this, {
			get(target, prop, receiver) {
				if (
					typeof target[prop] === "function" &&
					prop !== "_ensureLZStringLoaded"
				) {
					return async (...args) => {
						if (target.enableCompression) {
							await target._ensureLZStringLoaded();
						}
						return target[prop](...args);
					};
				}
				return Reflect.get(target, prop, receiver);
			},
		});
	}

	_isValidJSON(value) {
		try {
			JSON.stringify(value);
			return true;
		} catch (error) {
			return false;
		}
	}

	_ensureLZStringLoaded() {
		if (!this.enableCompression) return Promise.resolve();
		return include(
			"https://cdnjs.cloudflare.com/ajax/libs/lz-string/1.5.0/lz-string.min.js"
		);
	}

	_getNamespacedKey(key) {
		return this.namespace ? `${this.namespace}:${key}` : key;
	}

	async set(key, value) {
		if (!this._isValidJSON(value)) {
			throw new Error("Invalid JSON: Please provide a valid JSON object.");
		}

		const namespacedKey = this._getNamespacedKey(key);
		let data = { value };

		if (this.enableCompression) {
			data._compressed = true;
			const compressedData = LZString.compressToUTF16(JSON.stringify(data));
			this.storage.setItem(namespacedKey, compressedData);
		} else {
			this.storage.setItem(namespacedKey, JSON.stringify(data));
		}

		this.triggerListeners(namespacedKey);

		if (this.defaultExpiration[key]) {
			this.expires(key, this.defaultExpiration[key]);
		}
	}

	get(key) {
		const namespacedKey = this._getNamespacedKey(key);
		const storedData = this.storage.getItem(namespacedKey);

		if (!storedData) return null;

		let data;
		if (this.enableCompression) {
			const decompressedData = LZString.decompressFromUTF16(storedData);
			if (!decompressedData) {
				console.error("Failed to decompress data for get.");
				return null;
			}
			data = JSON.parse(decompressedData);
		} else {
			data = JSON.parse(storedData);
		}

		if (data.expiration && Date.now() > data.expiration) {
			this.remove(key);
			return null;
		}

		return data.value;
	}

	expires(key, expiresIn) {
		const namespacedKey = this._getNamespacedKey(key);
		const storedData = this.storage.getItem(namespacedKey);

		if (!storedData) {
			console.error(`No data found for key: ${namespacedKey}`);
			return;
		}

		let data;
		if (this.enableCompression) {
			const decompressedData = LZString.decompressFromUTF16(storedData);
			if (!decompressedData) {
				console.error("Failed to decompress data.");
				return;
			}
			data = JSON.parse(decompressedData);

			if (!data || !data._compressed) {
				console.error("Data was not compressed properly.");
				return;
			}
		} else {
			// Parse uncompressed JSON directly
			try {
				data = JSON.parse(storedData);
			} catch (e) {
				console.error("Failed to parse uncompressed data:", e);
				return;
			}
		}

		const expirationTime = Date.now() + expiresIn * 1000;
		data.expiration = expirationTime;

		if (this.enableCompression) {
			const compressedData = LZString.compressToUTF16(JSON.stringify(data));
			this.storage.setItem(namespacedKey, compressedData);
		} else {
			this.storage.setItem(namespacedKey, JSON.stringify(data));
		}

		if (this.expirationTimers[namespacedKey]) {
			clearTimeout(this.expirationTimers[namespacedKey]);
		}

		this.expirationTimers[namespacedKey] = setTimeout(() => {
			this.remove(key);
			this.triggerListeners(namespacedKey);
		}, expiresIn * 1000);

		this.triggerListeners(namespacedKey);
	}

	remove(key) {
		const namespacedKey = this._getNamespacedKey(key);
		this.storage.removeItem(namespacedKey);

		if (this.expirationTimers[namespacedKey]) {
			clearTimeout(this.expirationTimers[namespacedKey]);
			delete this.expirationTimers[namespacedKey];
		}

		this.triggerListeners(namespacedKey);
	}

	/**
	 * Check if a key exists and is not expired
	 */
	async has(key) {
		return this.get(key) !== null;
	}

	/**
	 * Get all keys in the current namespace
	 */
	async keys() {
		const prefix = this.namespace ? `${this.namespace}:` : '';
		const result = [];
		for (let i = 0; i < this.storage.length; i++) {
			const fullKey = this.storage.key(i);
			if (prefix && !fullKey.startsWith(prefix)) continue;
			result.push(fullKey.replace(prefix, ''));
		}
		return result;
	}

	/**
	 * Get all key-value pairs
	 */
	async getAll() {
		const all = {};
		const allKeys = await this.keys();
		for (const key of allKeys) {
			all[key] = this.get(key);
		}
		return all;
	}

	/**
	 * Remove multiple keys
	 */
	batchRemove(keys) {
		keys.forEach(key => this.remove(key));
	}

	clear() {
		this.storage.clear();
	}

	onChange(key, callback) {
		const namespacedKey = this._getNamespacedKey(key);
		this.listeners[namespacedKey] = callback;
	}

	/**
	 * Unsubscribe from change events for a key
	 */
	offChange(key) {
		const namespacedKey = this._getNamespacedKey(key);
		delete this.listeners[namespacedKey];
	}

	batchSet(items) {
		for (const { key, value, expiresIn } of items) {
			this.set(key, value);
			if (expiresIn) {
				this.expires(key, expiresIn);
			}
		}
	}

	batchGet(keys) {
		return keys.reduce((result, key) => {
			result[key] = this.get(key);
			return result;
		}, {});
	}

	cleanup() {
		for (let i = 0; i < this.storage.length; i++) {
			const key = this.storage.key(i);

			if (this.namespace && !key.startsWith(this.namespace)) {
				continue;
			}

			const actualKey = key.replace(`${this.namespace}:`, "");
			const value = this.get(actualKey);

			if (value === null) {
				console.log(`Removed expired item: ${actualKey}`);
			}
		}
	}

	initStorageListener() {
		window.addEventListener("storage", async (event) => {
			if (this.enableCompression) {
				await this._ensureLZStringLoaded();
			}
			const { key, newValue, oldValue } = event;
			if (this.listeners[key]) {
				const newData = newValue
					? JSON.parse(LZString.decompressFromUTF16(newValue)).value
					: null;
				const oldData = oldValue
					? JSON.parse(LZString.decompressFromUTF16(oldValue)).value
					: null;
				this.listeners[key](newData, oldData);
			}
		});
	}

	triggerListeners(key) {
		const namespacedKey = this._getNamespacedKey(key);
		if (this.listeners[namespacedKey]) {
			const newValue = this.storage.getItem(namespacedKey);
			const newData = newValue
				? JSON.parse(LZString.decompressFromUTF16(newValue)).value
				: null;
			this.listeners[namespacedKey](newData, null);
		}
	}
}
