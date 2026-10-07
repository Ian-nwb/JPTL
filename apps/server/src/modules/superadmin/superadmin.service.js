import Property from '../../shared/models/property.model.js';
import Unit from '../../shared/models/unit.model.js';
import User from '../../shared/models/user.model.js';
import SessionLog from '../../shared/models/sessionLog.model.js';
import AuditLog from '../../shared/models/auditLog.model.js';

// ═════════════════════════════════════════════════
// PROPERTIES CRUD
// ═════════════════════════════════════════════════

export async function getAllProperties({ search = '', category = '' } = {}) {
  const query = {};
  if (category) query.category = category;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { address: { $regex: search, $options: 'i' } },
      { city: { $regex: search, $options: 'i' } },
    ];
  }

  const properties = await Property.find(query)
    .populate('landlord', 'firstName lastName email phone')
    .sort({ createdAt: -1 });

  return properties;
}

export async function getPropertyById(id) {
  const property = await Property.findById(id).populate('landlord', 'firstName lastName email phone');
  if (!property) {
    const error = new Error('Property not found');
    error.statusCode = 404;
    throw error;
  }
  return property;
}

export async function createProperty(data) {
  const { name, address, city, category, landlord, unitsCount, buildingRules, accessCodes } = data;

  if (!name || !address || !city || !landlord) {
    const error = new Error('Name, address, city, and landlord are required');
    error.statusCode = 400;
    throw error;
  }

  // Verify landlord exists
  const landlordUser = await User.findById(landlord);
  if (!landlordUser) {
    const error = new Error('Designated landlord user not found');
    error.statusCode = 400;
    throw error;
  }

  const property = await Property.create({
    name: name.trim(),
    address: address.trim(),
    city: city.trim(),
    category: category || 'Residential',
    landlord,
    unitsCount: Number(unitsCount) || 0,
    buildingRules: buildingRules || [],
    accessCodes: accessCodes || {},
  });

  return property.populate('landlord', 'firstName lastName email phone');
}

export async function updateProperty(id, data) {
  const property = await Property.findById(id);
  if (!property) {
    const error = new Error('Property not found');
    error.statusCode = 404;
    throw error;
  }

  const allowedUpdates = [
    'name',
    'address',
    'city',
    'category',
    'image',
    'featured',
    'accessCodes',
    'buildingRules',
    'landlord',
    'unitsCount',
    'occupancyRate',
  ];

  for (const key of allowedUpdates) {
    if (data[key] !== undefined) {
      property[key] = data[key];
    }
  }

  await property.save();
  return property.populate('landlord', 'firstName lastName email phone');
}

export async function deleteProperty(id) {
  const property = await Property.findById(id);
  if (!property) {
    const error = new Error('Property not found');
    error.statusCode = 404;
    throw error;
  }

  // Also remove units associated with this property
  await Unit.deleteMany({ property: id });
  await property.deleteOne();

  return { message: 'Property and associated units deleted successfully' };
}

// ═════════════════════════════════════════════════
// UNITS CRUD
// ═════════════════════════════════════════════════

export async function getAllUnits({ search = '', propertyId = '', status = '' } = {}) {
  const query = {};
  if (propertyId) query.property = propertyId;
  if (status) query.status = status;
  if (search) {
    query.label = { $regex: search, $options: 'i' };
  }

  const units = await Unit.find(query)
    .populate('property', 'name address city')
    .populate('tenant', 'firstName lastName email phone')
    .sort({ createdAt: -1 });

  return units;
}

export async function getUnitById(id) {
  const unit = await Unit.findById(id)
    .populate('property', 'name address city')
    .populate('tenant', 'firstName lastName email phone');

  if (!unit) {
    const error = new Error('Unit not found');
    error.statusCode = 404;
    throw error;
  }
  return unit;
}

export async function createUnit(data) {
  const {
    label,
    property,
    monthlyRent,
    sqft,
    bedrooms = 0,
    bathrooms = 1,
    status = 'vacant',
    hasParking = false,
    parkingSpot = null,
    parkingFee = 0,
    tenant = null,
  } = data;

  const rent = monthlyRent !== undefined ? monthlyRent : data.rentAmount;
  const unitSqft = sqft !== undefined ? sqft : 500;

  if (!label || !property || rent === undefined) {
    const error = new Error('Label, property, and monthlyRent are required');
    error.statusCode = 400;
    throw error;
  }

  // Verify property exists
  const propDoc = await Property.findById(property);
  if (!propDoc) {
    const error = new Error('Parent property not found');
    error.statusCode = 400;
    throw error;
  }

  const unit = await Unit.create({
    label: label.trim(),
    property,
    monthlyRent: Number(rent),
    sqft: Number(unitSqft),
    bedrooms: Number(bedrooms),
    bathrooms: Number(bathrooms),
    status,
    hasParking: Boolean(hasParking),
    parkingSpot: parkingSpot ? parkingSpot.trim() : null,
    parkingFee: Number(parkingFee) || 0,
    tenant: tenant || null,
  });

  // Update property units count
  const count = await Unit.countDocuments({ property });
  propDoc.unitsCount = count;
  await propDoc.save();

  return unit.populate([
    { path: 'property', select: 'name address city' },
    { path: 'tenant', select: 'firstName lastName email phone' },
  ]);
}

export async function updateUnit(id, data) {
  const unit = await Unit.findById(id);
  if (!unit) {
    const error = new Error('Unit not found');
    error.statusCode = 404;
    throw error;
  }

  const allowedUpdates = [
    'label',
    'property',
    'monthlyRent',
    'sqft',
    'bedrooms',
    'bathrooms',
    'status',
    'hasParking',
    'parkingSpot',
    'parkingFee',
    'tenant',
    'leaseStart',
    'leaseEnd',
  ];

  for (const key of allowedUpdates) {
    if (data[key] !== undefined) {
      unit[key] = data[key];
    }
  }

  await unit.save();

  return unit.populate([
    { path: 'property', select: 'name address city' },
    { path: 'tenant', select: 'firstName lastName email phone' },
  ]);
}

export async function deleteUnit(id) {
  const unit = await Unit.findById(id);
  if (!unit) {
    const error = new Error('Unit not found');
    error.statusCode = 404;
    throw error;
  }

  const propertyId = unit.property;
  await unit.deleteOne();

  // Update property unitsCount
  if (propertyId) {
    const count = await Unit.countDocuments({ property: propertyId });
    await Property.findByIdAndUpdate(propertyId, { unitsCount: count });
  }

  return { message: 'Unit deleted successfully' };
}

// ═════════════════════════════════════════════════
// SESSIONS & LIVE MONITORING
// ═════════════════════════════════════════════════

export async function getSessionLogs({ limit = 50, page = 1, role = '', search = '' } = {}) {
  const query = {};
  if (role) query.role = role;
  if (search) {
    query.$or = [
      { email: { $regex: search, $options: 'i' } },
      { ip: { $regex: search, $options: 'i' } },
    ];
  }

  const safeLimit = Math.min(Number(limit) || 50, 100);
  const skip = (Math.max(Number(page) || 1, 1) - 1) * safeLimit;

  const [total, sessions] = await Promise.all([
    SessionLog.countDocuments(query),
    SessionLog.find(query)
      .populate('userId', 'firstName lastName email role')
      .sort({ loginAt: -1 })
      .skip(skip)
      .limit(safeLimit),
  ]);

  const activeCount = await SessionLog.countDocuments({ isActive: true });

  return {
    total,
    page: Number(page) || 1,
    limit: safeLimit,
    activeCount,
    sessions,
  };
}

export async function getLandlordsAndTenants() {
  const users = await User.find(
    { role: { $in: ['landlord', 'tenant'] } },
    'firstName lastName email role'
  ).sort({ firstName: 1 });

  return {
    landlords: users.filter((u) => u.role === 'landlord'),
    tenants: users.filter((u) => u.role === 'tenant'),
  };
}

// ═════════════════════════════════════════════════
// USERS CRUD (LANDLORDS & TENANTS)
// ═════════════════════════════════════════════════

export async function getAllUsers({ role = '', search = '', status = '' } = {}) {
  const query = {};
  if (role && role !== 'all') query.role = role;
  if (status && status !== 'all') query.status = status;
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ];
  }

  const users = await User.find(query)
    .populate('landlord', 'firstName lastName email')
    .sort({ createdAt: -1 });

  return users;
}

export async function getUserById(id) {
  const user = await User.findById(id).populate('landlord', 'firstName lastName email');
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }
  return user;
}

export async function createUser(data) {
  const { firstName, middleName = '', lastName, email, phone = '', password, role = 'landlord', plan = 'starter', landlord = null } = data;

  if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !password) {
    const error = new Error('First name, last name, email, and password are required');
    error.statusCode = 400;
    throw error;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    const error = new Error('Email is already registered');
    error.statusCode = 409;
    throw error;
  }

  const user = await User.create({
    firstName: firstName.trim(),
    middleName: middleName.trim(),
    lastName: lastName.trim(),
    email: normalizedEmail,
    phone: phone.trim(),
    password,
    role,
    plan,
    landlord: landlord || null,
    onboardingCompleted: true,
    status: 'active',
  });

  return user.populate('landlord', 'firstName lastName email');
}

export async function updateUser(id, data) {
  const user = await User.findById(id);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  const allowedUpdates = [
    'firstName',
    'middleName',
    'lastName',
    'email',
    'phone',
    'role',
    'plan',
    'status',
    'landlord',
    'onboardingCompleted',
  ];

  for (const key of allowedUpdates) {
    if (data[key] !== undefined) {
      user[key] = data[key];
    }
  }

  if (data.password && data.password.trim()) {
    user.password = data.password.trim();
  }

  await user.save();
  return user.populate('landlord', 'firstName lastName email');
}

export async function deleteUser(id) {
  const user = await User.findById(id);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  // If landlord, unlink properties or unassign
  await Property.updateMany({ landlord: id }, { landlord: null });
  // If tenant, unlink units
  await Unit.updateMany({ tenant: id }, { tenant: null, status: 'vacant' });

  await user.deleteOne();
  return { message: 'User deleted successfully' };
}


// ═════════════════════════════════════════════════
// AUDIT TRAIL
// ═════════════════════════════════════════════════

export async function getAuditLogs({
  page = 1, limit = 50, actorRole = '', action = '',
  entityKind = '', search = '', startDate = '', endDate = '',
} = {}) {
  const safeLimit = Math.min(Number(limit) || 50, 200);
  const skip = (Math.max(Number(page) || 1, 1) - 1) * safeLimit;
  const filter = {};
  if (actorRole) filter.actorRole = actorRole;
  if (action) filter.action = { $regex: action, $options: 'i' };
  if (entityKind) filter.entityKind = entityKind;
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  const [total, logs] = await Promise.all([
    AuditLog.countDocuments(filter),
    AuditLog.find(filter)
      .populate('actor', 'firstName middleName lastName email role')
      .sort({ createdAt: -1 }).skip(skip).limit(safeLimit).lean(),
  ]);

  let formatted = logs.map((log) => ({
    id: log._id,
    timestamp: log.createdAt,
    actor: log.actor
      ? { id: log.actor._id, name: [log.actor.firstName, log.actor.middleName, log.actor.lastName].filter(Boolean).join(' '), email: log.actor.email, role: log.actor.role }
      : null,
    actorRole: log.actorRole,
    action: log.action,
    entityKind: log.entityKind,
    entityId: log.entityId,
    ipAddress: log.ipAddress || '',
  }));

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    formatted = formatted.filter((l) =>
      l.actor?.name?.toLowerCase().includes(q) ||
      l.actor?.email?.toLowerCase().includes(q) ||
      l.action?.toLowerCase().includes(q) ||
      l.entityKind?.toLowerCase().includes(q)
    );
  }

  return { total, page: Number(page) || 1, limit: safeLimit, logs: formatted };
}

export async function exportAuditLogsCsv(filters = {}) {
  const { logs } = await getAuditLogs({ ...filters, page: 1, limit: 5000 });
  const headers = ['Timestamp', 'Actor Name', 'Actor Email', 'Role', 'Action', 'Entity Type', 'Entity ID', 'IP Address'];
  const csvLines = [headers.join(',')];
  for (const log of logs) {
    csvLines.push([
      `"${new Date(log.timestamp).toISOString()}"`,
      `"${log.actor?.name || ''}"`,
      `"${log.actor?.email || ''}"`,
      `"${log.actorRole}"`,
      `"${log.action}"`,
      `"${log.entityKind}"`,
      `"${log.entityId || ''}"`,
      `"${log.ipAddress}"`,
    ].join(','));
  }
  return { filename: `Audit_Trail_${new Date().toISOString().slice(0, 10)}.csv`, csv: csvLines.join('\n'), count: logs.length };
}

export async function exportSessionLogsCsv({ role = '', search = '' } = {}) {
  const filter = {};
  if (role) filter.role = role;
  if (search) filter.$or = [{ email: { $regex: search, $options: 'i' } }, { ip: { $regex: search, $options: 'i' } }];

  const sessions = await SessionLog.find(filter).sort({ loginAt: -1 }).limit(5000).lean();
  const headers = ['Login At', 'Logout At', 'Duration (min)', 'Email', 'Role', 'IP', 'User Agent', 'Status'];
  const csvLines = [headers.join(',')];
  for (const s of sessions) {
    const loginAt = s.loginAt ? new Date(s.loginAt) : null;
    const logoutAt = s.logoutAt ? new Date(s.logoutAt) : null;
    const durationMin = loginAt && logoutAt ? Math.round((logoutAt - loginAt) / 60000) : '';
    csvLines.push([
      `"${loginAt ? loginAt.toISOString() : ''}"`,
      `"${logoutAt ? logoutAt.toISOString() : ''}"`,
      `"${durationMin}"`,
      `"${s.email}"`,
      `"${s.role}"`,
      `"${s.ip}"`,
      `"${(s.userAgent || '').replace(/"/g, "'")}"`,
      `"${s.isActive ? 'Active' : 'Ended'}"`,
    ].join(','));
  }
  return { filename: `Session_Logs_${new Date().toISOString().slice(0, 10)}.csv`, csv: csvLines.join('\n'), count: sessions.length };
}
