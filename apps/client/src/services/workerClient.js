import { tokenStorage } from './api';

let workerInstance = null;
let reqIdSequence = 0;
const pendingRequests = new Map();
const inFlightBatches = new Map();
const cacheStore = new Map();
const CLIENT_CACHE_TTL_MS = 5000; // 5 seconds instant cache for repeat reads

function getWorker() {
  if (typeof window === 'undefined' || typeof window.Worker === 'undefined') {
    return null;
  }

  if (!workerInstance) {
    try {
      workerInstance = new Worker(
        new URL('../workers/fetchWorker.js', import.meta.url),
        { type: 'module' }
      );

      workerInstance.onmessage = (e) => {
        const { id, type, payload, error } = e.data || {};
        const pending = pendingRequests.get(id);
        if (!pending) return;

        pendingRequests.delete(id);
        if (type === 'FETCH_CONCURRENT_SUCCESS') {
          pending.resolve(payload);
        } else {
          pending.reject(new Error(error || 'Worker execution failed'));
        }
      };

      workerInstance.onerror = (err) => {
        console.warn('Web Worker error, continuing with fallback:', err.message);
      };
    } catch (err) {
      console.warn('Unable to initialize Web Worker in this environment:', err.message);
      workerInstance = null;
    }
  }

  return workerInstance;
}

/**
 * Fetch multiple endpoints concurrently using a Web Worker.
 * Offloads concurrent HTTP network calls and JSON parsing off the UI thread.
 * Falls back to main thread Promise.all if worker is unavailable.
 *
 * @param {Array<{ key: string, endpoint: string, method?: string, body?: any }>} tasks
 * @returns {Promise<Record<string, { key: string, ok: boolean, status: number, data?: any, error?: string }>>}
 */
export async function fetchConcurrent(tasks) {
  if (!Array.isArray(tasks) || tasks.length === 0) {
    return {};
  }

  const isPureGet = tasks.every((t) => !t.method || t.method === 'GET');
  const batchKey = tasks.map((t) => `${t.method || 'GET'}:${t.endpoint}`).join('|');
  const now = Date.now();

  // Instant response if fresh cached data exists
  if (isPureGet && cacheStore.has(batchKey)) {
    const entry = cacheStore.get(batchKey);
    if (now - entry.timestamp < CLIENT_CACHE_TTL_MS) {
      return entry.data;
    }
  }

  // Deduplicate identical in-flight batch fetches (e.g. React StrictMode mount)
  if (inFlightBatches.has(batchKey)) {
    return inFlightBatches.get(batchKey);
  }

  const worker = getWorker();
  const token = tokenStorage.getToken();
  const baseUrl = import.meta.env.VITE_API_URL || '/api';

  let fetchPromise;

  if (worker) {
    const id = ++reqIdSequence;
    fetchPromise = new Promise((resolve, reject) => {
      pendingRequests.set(id, { resolve, reject });
      worker.postMessage({
        id,
        type: 'FETCH_CONCURRENT',
        tasks,
        baseUrl,
        token,
      });
    });
  } else {
    // High-performance Promise.all fallback on main thread
    fetchPromise = (async () => {
      const results = await Promise.all(
        tasks.map(async (task) => {
          const { key, endpoint, method = 'GET', body = null } = task;
          const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;
          const headers = { 'Content-Type': 'application/json' };
          if (token) headers.Authorization = `Bearer ${token}`;

          const opts = { method, headers, credentials: 'include' };
          if (body && method !== 'GET') {
            opts.body = typeof body === 'string' ? body : JSON.stringify(body);
          }

          try {
            const res = await fetch(url, opts);
            const data = await res.json().catch(() => null);
            return { key, ok: res.ok, status: res.status, data };
          } catch (err) {
            return { key, ok: false, status: 0, error: err.message };
          }
        })
      );

      const payload = {};
      for (const r of results) {
        payload[r.key] = r;
      }
      return payload;
    })();
  }

  // Cache response for GET operations
  fetchPromise
    .then((payload) => {
      if (isPureGet && payload) {
        cacheStore.set(batchKey, { timestamp: Date.now(), data: payload });
      }
    })
    .finally(() => {
      inFlightBatches.delete(batchKey);
    });

  // Track in-flight batch to avoid duplicate requests during mount
  inFlightBatches.set(batchKey, fetchPromise);

  return fetchPromise;
}
