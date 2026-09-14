const API_BASE = import.meta.env.VITE_API_URL || '/api';

export function getAuthToken() {
  return sessionStorage.getItem('jptl_superadmin_token') || '';
}

export function setAuthSession({ token, user }) {
  if (token) sessionStorage.setItem('jptl_superadmin_token', token);
  if (user) sessionStorage.setItem('jptl_superadmin_user', JSON.stringify(user));
  sessionStorage.setItem('jptl_superadmin_auth', 'true');
}

export function clearAuthSession() {
  sessionStorage.removeItem('jptl_superadmin_token');
  sessionStorage.removeItem('jptl_superadmin_user');
  sessionStorage.removeItem('jptl_superadmin_auth');
}

async function request(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearAuthSession();
    window.dispatchEvent(new CustomEvent('superadmin-unauthorized'));
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Session expired. Please log in again.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `Request failed (${response.status})`);
  }

  return data;
}

// ─── AUTH ───
export async function loginSuperadmin({ email, password }) {
  const data = await request('/auth/superadmin/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (data.token) {
    setAuthSession({ token: data.token, user: data.user });
  }
  return data;
}

export async function logoutSuperadmin() {
  try {
    await request('/auth/logout', { method: 'POST' });
  } catch (err) {
    console.warn('Logout API error:', err);
  } finally {
    clearAuthSession();
  }
}

// ─── PROPERTIES CRUD ───
export async function getProperties({ search = '', category = '' } = {}) {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (category) params.append('category', category);
  const query = params.toString() ? `?${params.toString()}` : '';
  return request(`/superadmin/properties${query}`);
}

export async function getPropertyById(id) {
  return request(`/superadmin/properties/${id}`);
}

export async function createProperty(payload) {
  return request('/superadmin/properties', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateProperty(id, payload) {
  return request(`/superadmin/properties/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteProperty(id) {
  return request(`/superadmin/properties/${id}`, {
    method: 'DELETE',
  });
}

// ─── UNITS CRUD ───
export async function getUnits({ search = '', propertyId = '', status = '' } = {}) {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (propertyId) params.append('propertyId', propertyId);
  if (status) params.append('status', status);
  const query = params.toString() ? `?${params.toString()}` : '';
  return request(`/superadmin/units${query}`);
}

export async function getUnitById(id) {
  return request(`/superadmin/units/${id}`);
}

export async function createUnit(payload) {
  return request('/superadmin/units', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateUnit(id, payload) {
  return request(`/superadmin/units/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteUnit(id) {
  return request(`/superadmin/units/${id}`, {
    method: 'DELETE',
  });
}

// ─── SESSIONS & LIVE MONITORING ───
export async function getSessionLogs({ page = 1, limit = 50, role = '', search = '' } = {}) {
  const params = new URLSearchParams();
  params.append('page', page);
  params.append('limit', limit);
  if (role) params.append('role', role);
  if (search) params.append('search', search);
  return request(`/superadmin/sessions?${params.toString()}`);
}

export function subscribeToSessionStream(onEvent, onError) {
  const token = getAuthToken();
  const url = `${API_BASE}/superadmin/sessions/stream?token=${encodeURIComponent(token)}`;
  const eventSource = new EventSource(url);

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onEvent(data);
    } catch (err) {
      console.error('Failed to parse SSE event data:', err);
    }
  };

  eventSource.onerror = (err) => {
    if (onError) onError(err);
  };

  return () => {
    eventSource.close();
  };
}

// ─── LOOKUPS ───
export async function getUsersLookup() {
  return request('/superadmin/lookup/users');
}

// ─── USERS CRUD (LANDLORDS & TENANTS) ───
export async function getUsers({ role = '', search = '', status = '' } = {}) {
  const params = new URLSearchParams();
  if (role) params.append('role', role);
  if (search) params.append('search', search);
  if (status) params.append('status', status);
  const query = params.toString() ? `?${params.toString()}` : '';
  return request(`/superadmin/users${query}`);
}

export async function getUserById(id) {
  return request(`/superadmin/users/${id}`);
}

export async function createUser(payload) {
  return request('/superadmin/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateUser(id, payload) {
  return request(`/superadmin/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteUser(id) {
  return request(`/superadmin/users/${id}`, {
    method: 'DELETE',
  });
}

// ─── SYSTEM MAINTENANCE MODE ───
export async function getMaintenanceStatus() {
  return request('/superadmin/system/maintenance');
}

export async function setMaintenanceMode(enabled, message = '') {
  return request('/superadmin/system/maintenance', {
    method: 'POST',
    body: JSON.stringify({ enabled, message }),
  });
}

