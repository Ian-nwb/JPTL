import * as superadminService from './superadmin.service.js';
import { sessionEvents } from '../../shared/services/sessionMonitor.service.js';

// ─── Properties Controller ───

export async function getProperties(req, res) {
  try {
    const { search, category } = req.query;
    const properties = await superadminService.getAllProperties({ search, category });
    return res.status(200).json({ success: true, count: properties.length, properties });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({ success: false, message: err.message });
  }
}

export async function getPropertyById(req, res) {
  try {
    const property = await superadminService.getPropertyById(req.params.id);
    return res.status(200).json({ success: true, property });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({ success: false, message: err.message });
  }
}

export async function createProperty(req, res) {
  try {
    const property = await superadminService.createProperty(req.body);
    return res.status(201).json({ success: true, property });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({ success: false, message: err.message });
  }
}

export async function updateProperty(req, res) {
  try {
    const property = await superadminService.updateProperty(req.params.id, req.body);
    return res.status(200).json({ success: true, property });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({ success: false, message: err.message });
  }
}

export async function deleteProperty(req, res) {
  try {
    const result = await superadminService.deleteProperty(req.params.id);
    return res.status(200).json({ success: true, message: result.message });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({ success: false, message: err.message });
  }
}

// ─── Units Controller ───

export async function getUnits(req, res) {
  try {
    const { search, propertyId, status } = req.query;
    const units = await superadminService.getAllUnits({ search, propertyId, status });
    return res.status(200).json({ success: true, count: units.length, units });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({ success: false, message: err.message });
  }
}

export async function getUnitById(req, res) {
  try {
    const unit = await superadminService.getUnitById(req.params.id);
    return res.status(200).json({ success: true, unit });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({ success: false, message: err.message });
  }
}

export async function createUnit(req, res) {
  try {
    const unit = await superadminService.createUnit(req.body);
    return res.status(201).json({ success: true, unit });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({ success: false, message: err.message });
  }
}

export async function updateUnit(req, res) {
  try {
    const unit = await superadminService.updateUnit(req.params.id, req.body);
    return res.status(200).json({ success: true, unit });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({ success: false, message: err.message });
  }
}

export async function deleteUnit(req, res) {
  try {
    const result = await superadminService.deleteUnit(req.params.id);
    return res.status(200).json({ success: true, message: result.message });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({ success: false, message: err.message });
  }
}

// ─── Live Monitoring & Sessions Controller ───

export async function getSessionLogs(req, res) {
  try {
    const { limit, page, role, search } = req.query;
    const data = await superadminService.getSessionLogs({ limit, page, role, search });
    return res.status(200).json({ success: true, ...data });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({ success: false, message: err.message });
  }
}

export async function getUsersLookup(req, res) {
  try {
    const data = await superadminService.getLandlordsAndTenants();
    return res.status(200).json({ success: true, ...data });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({ success: false, message: err.message });
  }
}

// ─── Users Controller (Landlords & Tenants CRUD) ───

export async function getUsers(req, res) {
  try {
    const { role, search, status } = req.query;
    const users = await superadminService.getAllUsers({ role, search, status });
    return res.status(200).json({ success: true, count: users.length, users });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({ success: false, message: err.message });
  }
}

export async function getUserById(req, res) {
  try {
    const user = await superadminService.getUserById(req.params.id);
    return res.status(200).json({ success: true, user });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({ success: false, message: err.message });
  }
}

export async function createUser(req, res) {
  try {
    const user = await superadminService.createUser(req.body);
    return res.status(201).json({ success: true, user });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({ success: false, message: err.message });
  }
}

export async function updateUser(req, res) {
  try {
    const user = await superadminService.updateUser(req.params.id, req.body);
    return res.status(200).json({ success: true, user });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({ success: false, message: err.message });
  }
}

export async function deleteUser(req, res) {
  try {
    const result = await superadminService.deleteUser(req.params.id);
    return res.status(200).json({ success: true, message: result.message });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({ success: false, message: err.message });
  }
}


/**
 * Server-Sent Events (SSE) stream for real-time live monitoring of logins & logouts.
 */
export function streamSessions(req, res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  // Initial connection confirmation
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', timestamp: new Date().toISOString() })}\n\n`);

  const onLogin = (session) => {
    res.write(`data: ${JSON.stringify({ type: 'LOGIN', session })}\n\n`);
  };

  const onLogout = (session) => {
    res.write(`data: ${JSON.stringify({ type: 'LOGOUT', session })}\n\n`);
  };

  sessionEvents.on('login', onLogin);
  sessionEvents.on('logout', onLogout);

  // Keep-alive heartbeat every 20 seconds
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 20000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sessionEvents.off('login', onLogin);
    sessionEvents.off('logout', onLogout);
  });
}
