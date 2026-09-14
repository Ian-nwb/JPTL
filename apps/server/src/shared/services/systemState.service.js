import SystemSetting from '../models/systemSetting.model.js';

let inMemoryState = {
  enabled: false,
  message: 'Platform is currently undergoing scheduled maintenance. Please check back shortly.',
  updatedAt: new Date(),
};

/**
 * Get current maintenance state.
 * Queries MongoDB so all cluster worker threads and processes see the real-time state.
 */
export async function getMaintenanceState() {
  try {
    const setting = await SystemSetting.findOne({ key: 'maintenance_mode' }).lean();
    if (setting?.value) {
      inMemoryState = {
        enabled: Boolean(setting.value.enabled),
        message: setting.value.message || inMemoryState.message,
        updatedAt: setting.updatedAt || new Date(),
      };
    }
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
