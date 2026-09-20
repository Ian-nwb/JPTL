import SystemSetting from '../models/systemSetting.model.js';

let inMemoryState = {
  enabled: false,
  message: 'Platform is currently undergoing scheduled maintenance. Please check back shortly.',
  updatedAt: new Date(),
};
let lastFetchedAt = 0;
const CACHE_TTL_MS = 10000; // 10s in-memory cache to eliminate repetitive DB queries

/**
 * Get current maintenance state.
 * Queries MongoDB every 10s so all cluster worker threads see real-time state with sub-millisecond response.
 */
export async function getMaintenanceState() {
  const now = Date.now();
  if (now - lastFetchedAt < CACHE_TTL_MS) {
    return inMemoryState;
  }

  try {
    const setting = await SystemSetting.findOne({ key: 'maintenance_mode' }).lean();
    if (setting?.value) {
      inMemoryState = {
        enabled: Boolean(setting.value.enabled),
        message: setting.value.message || inMemoryState.message,
        updatedAt: setting.updatedAt || new Date(),
      };
    }
    lastFetchedAt = now;
  } catch (err) {
    // If DB query fails or not yet connected, use cached in-memory state
  }
  return inMemoryState;
}

/**
 * Set maintenance state in MongoDB and update local cache.
 */
export async function setMaintenanceState(enabled, message = '') {
  const isEnabled = Boolean(enabled);
  const msg = (message && message.trim()) || inMemoryState.message;

  inMemoryState = {
    enabled: isEnabled,
    message: msg,
    updatedAt: new Date(),
  };
  lastFetchedAt = Date.now();

  try {
    await SystemSetting.findOneAndUpdate(
      { key: 'maintenance_mode' },
      {
        key: 'maintenance_mode',
        value: {
          enabled: isEnabled,
          message: msg,
        },
      },
      { upsert: true, returnDocument: 'after' }
    );
  } catch (err) {
    console.error('Failed to persist maintenance_mode to MongoDB:', err.message);
  }

  return inMemoryState;
}
