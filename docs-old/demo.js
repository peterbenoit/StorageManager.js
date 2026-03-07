document.addEventListener('DOMContentLoaded', async () => {
	// --- Utility functions ---
	const el = id => document.getElementById(id);

	// --- DOM Elements ---
	const namespaceInput = el('dm-namespace');
	const defaultExpInput = el('dm-default-exp');
	const storageTypeCheckbox = el('dm-storage-type');
	const compressCheckbox = el('dm-compress');
	const applyConfigBtn = el('btn-apply-config');
	const keyInput = el('dm-key');
	const valueInput = el('dm-value');
	const expiresInput = el('dm-expires');
	const outputCode = el('dm-output');
	const storageStateCode = el('dm-storage-state');
	const namespaceLabel = el('namespace-label');
	const storageStateLabel = el('storage-state-label');

	// --- Create StorageManager Instance ---
	let demoMgr = createStorageManager();

	// --- Apply button pulse effect ---
	function highlightApplyButton() {
		applyConfigBtn.classList.add('pulse-button');

		// Remove after 10 seconds if not clicked
		setTimeout(() => {
			applyConfigBtn.classList.remove('pulse-button');
		}, 10000);
	}

	// Add change listeners to all config inputs
	[namespaceInput, defaultExpInput, storageTypeCheckbox, compressCheckbox].forEach(element => {
		element.addEventListener('change', highlightApplyButton);
		element.addEventListener('input', highlightApplyButton);
	});

	// Remove pulse effect when apply button is clicked
	applyConfigBtn.addEventListener('click', () => {
		applyConfigBtn.classList.remove('pulse-button');
	});

	function createStorageManager() {
		// Get configuration values
		const useSession = storageTypeCheckbox.checked;
		const namespace = namespaceInput.value.trim() || 'demo';
		const enableCompression = compressCheckbox.checked;
		const defaultExpiration = {};

		// Try to parse default expiration JSON
		try {
			const expText = defaultExpInput.value.trim();
			if (expText) {
				Object.assign(defaultExpiration, JSON.parse(expText));
			}
		} catch (e) {
			console.warn("Invalid default expiration JSON:", e);
		}

		// Update UI labels
		namespaceLabel.textContent = namespace;
		storageStateLabel.textContent = useSession ? 'sessionStorage' : 'localStorage';

		// Create new instance
		return new StorageManager(useSession, {
			namespace,
			defaultExpiration,
			enableCompression
		});
	}

	const showOutput = (message, isError = false) => {
		console.log(isError ? 'Error:' : 'Output:', message);
		outputCode.textContent = typeof message === 'string' ? message : JSON.stringify(message, null, 2);
		outputCode.parentElement.classList.toggle('border-red-500', isError);
		outputCode.parentElement.classList.toggle('border-gray-600', !isError);
		// Re-highlight if Prism is loaded
		if (window.Prism) {
			Prism.highlightElement(outputCode);
		}
	};

	const updateStorageState = async () => {
		// Ensure LZString is ready before any decompress calls
		if (demoMgr.enableCompression) {
			await demoMgr._ensureLZStringLoaded();
		}
		try {
			const keys = await demoMgr.keys();
			const state = {};

			// First get all values using regular API - this ensures we see the actual values
			for (const key of keys) {
				const value = await demoMgr.get(key);
				state[key] = value; // Store the actual retrieved value
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

			// Create a more informative output that includes the value
			let out;
			if (successMessage && successMessage.includes('Set "') && result === undefined) {
				// For set operations, show what was actually set
				const key = keyInput.value.trim();
				const valuePreview = JSON.stringify(JSON.parse(valueInput.value || 'null'));
				const truncatedValue = valuePreview.length > 50 ?
					valuePreview.substring(0, 47) + '...' : valuePreview;
				out = `✅ Successfully set "${key}" with value: ${truncatedValue}`;
			} else {
				out = successMessage && result !== undefined
					? `${successMessage} ${typeof result === 'object' ? JSON.stringify(result, null, 2) : result}`
					: (result !== undefined ? result : successMessage);
			}

			showOutput(out);
		} catch (e) {
			showOutput(`❌ Error: ${e.message}`, true);
		}
		await updateStorageState();
	};

	// --- Event Listeners: Configuration ---
	applyConfigBtn.addEventListener('click', async () => {
		try {
			// Validate default expiration JSON if provided
			if (defaultExpInput.value.trim()) {
				try {
					JSON.parse(defaultExpInput.value);
				} catch (e) {
					return showOutput(`Invalid default expiration JSON: ${e.message}`, true);
				}
			}

			// Create new storage manager with current config
			demoMgr = createStorageManager();

			// Show success message with config details
			showOutput(`StorageManager reconfigured:
- Storage: ${demoMgr.storage === window.sessionStorage ? 'sessionStorage' : 'localStorage'}
- Namespace: "${demoMgr.namespace}"
- Compression: ${demoMgr.enableCompression ? 'enabled' : 'disabled'}
- Default Expirations: ${JSON.stringify(demoMgr.defaultExpiration)}`);

			await updateStorageState();
		} catch (e) {
			showOutput(`Error applying configuration: ${e.message}`, true);
		}
	});

	// --- Event Listeners: Basic Operations ---
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
				return; // Return undefined to trigger special handling in safeRun
			}
			return; // Return undefined to trigger special handling in safeRun
		}, `Set "${key}" with value and expiration of ${expiresIn}s.`);
	});

	el('btn-get').addEventListener('click', () => {
		const key = keyInput.value.trim();
		if (!key) return showOutput('Key cannot be empty.', true);
		safeRun(() => demoMgr.get(key), `Value for "${key}":`);
	});

	el('btn-has').addEventListener('click', () => {
		const key = keyInput.value.trim();
		if (!key) return showOutput('Key cannot be empty.', true);
		safeRun(async () => `Key "${key}" exists and not expired? ${await demoMgr.has(key)}`);
	});

	el('btn-remove').addEventListener('click', () => {
		const key = keyInput.value.trim();
		if (!key) return showOutput('Key cannot be empty.', true);
		safeRun(() => demoMgr.remove(key), `Removed key "${key}".`);
	});

	// --- Event Listeners: Advanced Operations ---
	el('btn-expires').addEventListener('click', () => {
		const key = keyInput.value.trim();
		if (!key) return showOutput('Key cannot be empty.', true);

		const expiresIn = parseInt(expiresInput.value, 10);
		if (isNaN(expiresIn) || expiresIn <= 0) {
			return showOutput('Please enter a valid positive number for expiration seconds.', true);
		}

		safeRun(() => demoMgr.expires(key, expiresIn), `Set expiration for "${key}" to ${expiresIn}s.`);
	});

	el('btn-keys').addEventListener('click', () => {
		safeRun(() => demoMgr.keys(), 'Keys in namespace:');
	});

	el('btn-getall').addEventListener('click', () => {
		safeRun(() => demoMgr.getAll(), 'All key-value pairs:');
	});

	el('btn-clear').addEventListener('click', () => {
		if (confirm(`Are you sure you want to clear ALL items in the "${demoMgr.namespace}" namespace?`)) {
			safeRun(() => demoMgr.clear(), `Cleared all keys in ${demoMgr.namespace} namespace.`);
		}
	});

	// --- Event Listeners: Batch Operations Demo ---
	el('btn-batch-demo').addEventListener('click', () => {
		safeRun(async () => {
			// Example batch operations
			const batchItems = [
				{ key: 'user1', value: { name: 'Alice', role: 'admin' }, expiresIn: 60 },
				{ key: 'user2', value: { name: 'Bob', role: 'user' }, expiresIn: 120 },
				{ key: 'settings', value: { theme: 'dark', notifications: true } }
			];

			await demoMgr.batchSet(batchItems);

			const result = await demoMgr.batchGet(['user1', 'user2', 'settings', 'nonexistent']);

			return {
				message: 'Batch demo executed successfully',
				created: batchItems.map(item => item.key),
				retrieved: result
			};
		});
	});

	// --- Initial Load ---
	// Load LZString if needed
	await demoMgr._ensureLZStringLoaded();
	updateStorageState();
	showOutput('👋 Demo ready! Follow these steps:\n1. Enter a key in the "Key" field\n2. Enter a JSON value in the "Value" field\n3. Click "Set Value" to store it\n4. Try other operations with the stored key\n\n💡 Note: Compression is disabled by default. Enable it in the Configuration section if needed.');

	// Listen to storage events to update state if changed in another tab
	window.addEventListener('storage', (event) => {
		const prefix = demoMgr.namespace ? `${demoMgr.namespace}:` : '';
		if (event.key && event.key.startsWith(prefix)) {
			console.log('Storage event detected:', event.key);
			updateStorageState();
		}
	});

	// Update state when visibility changes (tab becomes active)
	document.addEventListener('visibilitychange', () => {
		if (document.visibilityState === 'visible') {
			updateStorageState();
		}
	});
});
