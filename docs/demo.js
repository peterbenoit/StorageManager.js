document.addEventListener('DOMContentLoaded', () => {
	// --- Setup ---
	const demoMgr = new StorageManager(false, { namespace: 'demo', enableCompression: true });
	const el = id => document.getElementById(id);
	const keyInput = el('dm-key');
	const valueInput = el('dm-value');
	const expiresInput = el('dm-expires');
	const outputCode = el('dm-output');
	const storageStateCode = el('dm-storage-state');

	const showOutput = (message, isError = false) => {
		console.log(isError ? 'Error:' : 'Output:', message); // Log for debugging
		outputCode.textContent = typeof message === 'string' ? message : JSON.stringify(message, null, 2);
		outputCode.parentElement.classList.toggle('border-red-500', isError);
		outputCode.parentElement.classList.toggle('border-gray-600', !isError);
		// Re-highlight if Prism is loaded
		if (window.Prism) {
			Prism.highlightElement(outputCode);
		}
	};

	const updateStorageState = async () => {
		try {
			const keys = await demoMgr.keys();
			const state = {};
			for (const key of keys) {
				// Use internal storage directly to show raw value + metadata if possible
				// This requires peeking into implementation details or adding a debug method
				// For now, just get the value
				try {
					const namespacedKey = demoMgr._getNamespacedKey(key); // Access private method for demo
					const raw = demoMgr.storage.getItem(namespacedKey);
					if (raw) {
						if (demoMgr.enableCompression && raw.length > 10) { // Basic check if likely compressed
							try {
								const decompressed = LZString.decompressFromUTF16(raw);
								state[key] = JSON.parse(decompressed || 'null'); // Show full stored object
							} catch { state[key] = "[Compressed Data - Error Decompressing]"; }
						} else {
							try { state[key] = JSON.parse(raw); }
							catch { state[key] = "[Invalid Raw Data]"; }
						}
					} else { state[key] = null; }
				} catch (e) { state[key] = `[Error reading raw: ${e.message}]`; }
			}
			storageStateCode.textContent = JSON.stringify(state, null, 2);
		} catch (e) {
			storageStateCode.textContent = `Error loading storage state: ${e.message}`;
		}
		if (window.Prism) {
			Prism.highlightElement(storageStateCode);
		}
	};

	const safeRun = async (fn, successMessage) => {
		try {
			const result = await fn();
			showOutput(successMessage || result);
		} catch (e) {
			showOutput(`Error: ${e.message}`, true);
		}
		await updateStorageState(); // Update state after every operation
	};

	// --- Event Listeners ---
	el('btn-set').addEventListener('click', () => {
		const key = keyInput.value.trim();
		if (!key) return showOutput('Key cannot be empty.', true);
		let value;
		try {
			value = JSON.parse(valueInput.value || 'null');
		} catch (e) {
			return showOutput(`Invalid JSON in Value field: ${e.message}`, true);
		}
		const expiresIn = parseInt(expiresInput.value, 10);

		safeRun(async () => {
			await demoMgr.set(key, value);
			if (!isNaN(expiresIn) && expiresIn > 0) {
				await demoMgr.expires(key, expiresIn);
				return `Set "${key}" with value and expiration of ${expiresIn}s.`;
			}
			return `Set "${key}" with value.`;
		});
	});

	el('btn-get').addEventListener('click', () => {
		const key = keyInput.value.trim();
		if (!key) return showOutput('Key cannot be empty.', true);
		safeRun(() => demoMgr.get(key), `Value for "${key}":`);
	});

	el('btn-expires').addEventListener('click', () => {
		const key = keyInput.value.trim();
		if (!key) return showOutput('Key cannot be empty.', true);
		const expiresIn = parseInt(expiresInput.value, 10);
		if (isNaN(expiresIn) || expiresIn <= 0) {
			return showOutput('Please enter a valid positive number for expiration seconds.', true);
		}
		safeRun(() => demoMgr.expires(key, expiresIn), `Set expiration for "${key}" to ${expiresIn}s.`);
	});

	el('btn-has').addEventListener('click', () => {
		const key = keyInput.value.trim();
		if (!key) return showOutput('Key cannot be empty.', true);
		safeRun(async () => `Key "${key}" exists and not expired? ${await demoMgr.has(key)}`);
	});

	el('btn-keys').addEventListener('click', () => {
		safeRun(() => demoMgr.keys(), 'Keys in demo namespace:');
	});

	el('btn-remove').addEventListener('click', () => {
		const key = keyInput.value.trim();
		if (!key) return showOutput('Key cannot be empty.', true);
		safeRun(() => demoMgr.remove(key), `Removed key "${key}".`);
	});

	el('btn-clear').addEventListener('click', () => {
		if (confirm('Are you sure you want to clear ALL items in the "demo" namespace?')) {
			safeRun(() => demoMgr.clear(), 'Cleared all keys in demo namespace.');
		}
	});

	// --- Initial Load ---
	updateStorageState(); // Show initial state

	// Listen to storage events to update state if changed in another tab
	window.addEventListener('storage', (event) => {
		// Check if the key belongs to our namespace
		const prefix = demoMgr.namespace ? `${demoMgr.namespace}:` : '';
		if (event.key && event.key.startsWith(prefix)) {
			console.log('Storage event detected for demo namespace:', event.key);
			updateStorageState();
		}
	});

	// Also update state when visibility changes (tab becomes active)
	document.addEventListener('visibilitychange', () => {
		if (document.visibilityState === 'visible') {
			updateStorageState();
		}
	});
});
