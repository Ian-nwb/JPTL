import EventEmitter from 'events';
import SessionLog from '../models/sessionLog.model.js';

class SessionMonitorEmitter extends EventEmitter {}

export const sessionEvents = new SessionMonitorEmitter();

/**
 * Record a user login and broadcast to live monitoring SSE subscribers.
 */
export async function recordLoginSession({ userId, email, role, ip = '', userAgent = '' }) {
  try {
    const session = await SessionLog.create({
      userId,
      email,
      role,
      ip,
      userAgent,
      loginAt: new Date(),
      isActive: true,
    });

    // Broadcast event
    sessionEvents.emit('login', session);
    return session;
  } catch (error) {
    console.error('Failed to record login session:', error);
    return null;
  }
}

/**
 * Record a user logout and broadcast to live monitoring SSE subscribers.
 */
export async function recordLogoutSession(userId) {
  try {
    if (!userId) return;
    const session = await SessionLog.findOneAndUpdate(
      { userId, isActive: true },
      { logoutAt: new Date(), isActive: false },
      { sort: { createdAt: -1 }, new: true }
    );

    if (session) {
      sessionEvents.emit('logout', session);
    }
    return session;
  } catch (error) {
    console.error('Failed to record logout session:', error);
    return null;
  }
}
