import Property from '../../shared/models/property.model.js';
import Unit from '../../shared/models/unit.model.js';
import User from '../../shared/models/user.model.js';
import SessionLog from '../../shared/models/sessionLog.model.js';

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

