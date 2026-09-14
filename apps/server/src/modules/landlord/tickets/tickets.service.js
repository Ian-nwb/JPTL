import Ticket from '../../../shared/models/ticket.model.js';
import Property from '../../../shared/models/property.model.js';
import Unit from '../../../shared/models/unit.model.js';
import AuditLog from '../../../shared/models/auditLog.model.js';
import User from '../../../shared/models/user.model.js';
import { sendPushToUsers } from '../../../shared/services/pushNotification.service.js';
import { createNotification } from '../../../shared/services/notification.service.js';

export class TicketError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

async function logAction({ actorId, action, entityKind = 'Ticket', entityId, beforeState = null, afterState = null, ipAddress = '' }) {
  try {
    await AuditLog.create({
      actor: actorId,
      actorRole: 'landlord',
      action,
      entityKind,
      entityId,
      beforeState,
      afterState,
      ipAddress,
    });
  } catch (err) {
    console.error('Ticket AuditLog error:', err.message);
  }
}

/**
 * GET all tickets for landlord's properties
 */
export async function getLandlordTickets(landlordId, query = {}) {
  const { status, priority, propertyId, search, page = 1, limit = 50 } = query;

  // 1. Find all properties of this landlord
  const landlordProperties = await Property.find({ landlord: landlordId }).lean();
  const propertyIds = landlordProperties.map((p) => p._id);
  const propertyMap = new Map(landlordProperties.map((p) => [p._id.toString(), p]));

  // 2. Find all units under landlord properties
  const unitFilter = { property: { $in: propertyIds } };
  if (propertyId && propertyIds.some((id) => id.toString() === propertyId)) {
    unitFilter.property = propertyId;
  }

  const units = await Unit.find(unitFilter).lean();
  const unitIds = units.map((u) => u._id);
  const unitMap = new Map(units.map((u) => [u._id.toString(), u]));

  // Also query tenants registered under this landlord
  const landlordTenants = await User.find({ landlord: landlordId }).select('_id').lean();
  const tenantIds = landlordTenants.map((t) => t._id);

  // 3. Build Ticket match filter
  const matchFilter = {
    $or: [
      { unit: { $in: unitIds } },
      { tenant: { $in: tenantIds } },
    ],
  };
  if (status && status !== 'all') {
    matchFilter.status = status;
  }
  if (priority && priority !== 'all') {
    matchFilter.priority = priority;
  }

  // 4. Fetch tickets with populated tenant and unit (including unit.property)
  const rawTickets = await Ticket.find(matchFilter)
    .populate('tenant', 'firstName lastName email phone')
    .populate({ path: 'unit', populate: { path: 'property' } })
    .sort({ createdAt: -1 })
    .lean();

  // 5. Format tickets with unit label and property details
  let formattedTickets = rawTickets.map((t) => {
    // Check if unit is populated object or ID
    const unitIdStr = t.unit?._id ? t.unit._id.toString() : (t.unit ? t.unit.toString() : null);
    let unitDoc = unitIdStr ? unitMap.get(unitIdStr) : null;
    if (!unitDoc && t.unit && typeof t.unit === 'object' && t.unit.label) {
      unitDoc = t.unit;
    }

    // Fallback: if unit is still not resolved, check if tenant is assigned to any unit under this landlord
    if (!unitDoc && t.tenant?._id) {
      const tenantIdStr = t.tenant._id.toString();
      unitDoc = units.find((u) => u.tenant && u.tenant.toString() === tenantIdStr);
    }

    // Resolve property: prefer populated property from unit, fallback to local map
    let propertyDoc = null;
    if (unitDoc?.property && typeof unitDoc.property === 'object' && unitDoc.property.name) {
      propertyDoc = unitDoc.property;
    } else {
      const propIdStr = unitDoc?.property?._id
        ? unitDoc.property._id.toString()
        : (unitDoc?.property ? unitDoc.property.toString() : null);
      propertyDoc = propIdStr ? propertyMap.get(propIdStr) : null;
    }

    const tenantName = t.tenant
      ? `${t.tenant.firstName || ''} ${t.tenant.lastName || ''}`.trim() || t.tenant.email
      : 'Unassigned';

    return {
      ...t,
      id: t._id,
      unitId: unitDoc?._id || t.unit?._id || t.unit || null,
      unitLabel: unitDoc?.label || 'Unit N/A',
      propertyId: propertyDoc?._id || null,
      propertyName: propertyDoc?.name || 'Property N/A',
      propertyAddress: propertyDoc?.address || '',
      tenantName,
      tenantEmail: t.tenant?.email || '',
      tenantPhone: t.tenant?.phone || '',
    };
  });


  // 6. Search filter (if provided)
  if (search?.trim()) {
    const s = search.trim().toLowerCase();
    formattedTickets = formattedTickets.filter(
      (t) =>
        t.title?.toLowerCase().includes(s) ||
        t.description?.toLowerCase().includes(s) ||
        t.propertyName?.toLowerCase().includes(s) ||
        t.unitLabel?.toLowerCase().includes(s) ||
        t.tenantName?.toLowerCase().includes(s)
    );
  }

  // 7. Calculate summary metrics
  const totalCount = formattedTickets.length;
  const submittedCount = formattedTickets.filter((t) => t.status === 'submitted').length;
  const acknowledgedCount = formattedTickets.filter((t) => t.status === 'acknowledged').length;
  const inProgressCount = formattedTickets.filter((t) => t.status === 'in_progress').length;
  const resolvedCount = formattedTickets.filter((t) => t.status === 'resolved').length;
  const emergencyCount = formattedTickets.filter((t) => t.priority === 'emergency' && t.status !== 'resolved').length;

  const paginatedTickets = formattedTickets.slice((Number(page) - 1) * Number(limit), Number(page) * Number(limit));

  return {
    tickets: paginatedTickets,
    metrics: {
      total: totalCount,
      submitted: submittedCount,
      acknowledged: acknowledgedCount,
      inProgress: inProgressCount,
      resolved: resolvedCount,
      emergency: emergencyCount,
    },
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: totalCount,
      totalPages: Math.ceil(totalCount / Number(limit)) || 1,
    },
  };
}

/**
 * GET single ticket by ID
 */
export async function getTicketById(landlordId, ticketId) {
  const ticket = await Ticket.findById(ticketId)
    .populate('tenant', 'firstName lastName email phone')
    .populate({ path: 'unit', populate: { path: 'property' } })
    .lean();

  if (!ticket) throw new TicketError('Ticket not found', 404);

  // Validate landlord ownership of property
  let unit = ticket.unit;
  if (!unit && ticket.tenant?._id) {
    unit = await Unit.findOne({ tenant: ticket.tenant._id }).lean();
  }

  let property = null;
  if (unit?.property && typeof unit.property === 'object' && unit.property.name) {
    property = unit.property;
  } else if (unit?.property) {
    const propId = unit.property._id || unit.property;
    property = await Property.findOne({ _id: propId, landlord: landlordId }).lean();
  }

  const tenantName = ticket.tenant
    ? `${ticket.tenant.firstName || ''} ${ticket.tenant.lastName || ''}`.trim() || ticket.tenant.email
    : 'Unassigned';

  return {
    ...ticket,
    id: ticket._id,
    unitLabel: unit?.label || 'Unit N/A',
    propertyName: property?.name || 'Property N/A',
    propertyAddress: property?.address || '',
    tenantName,
    tenantEmail: ticket.tenant?.email || '',
    tenantPhone: ticket.tenant?.phone || '',
  };
}

/**
 * CREATE a new ticket (Landlord initiated)
 */
export async function createLandlordTicket(landlordId, payload, ipAddress = '') {
  const { title, description, category, priority = 'medium', unitId, photoUrls = [], assignedTechnician } = payload;

  if (!title?.trim()) throw new TicketError('Ticket title is required', 400);
  if (!description?.trim()) throw new TicketError('Description is required', 400);
  if (!unitId) throw new TicketError('Unit ID is required', 400);

  const unit = await Unit.findById(unitId).lean();
  if (!unit) throw new TicketError('Unit not found', 404);

  const property = await Property.findOne({ _id: unit.property, landlord: landlordId }).lean();
  if (!property) throw new TicketError('Unit does not belong to your managed properties', 403);

  const tenantId = unit.tenant || landlordId;

  const initialHistory = [
    {
      status: assignedTechnician ? 'in_progress' : 'submitted',
      changedBy: landlordId,
      userRole: 'landlord',
      note: 'Ticket created by landlord',
      timestamp: new Date(),
    },
  ];

  const ticket = await Ticket.create({
    title: title.trim(),
    description: description.trim(),
    category: category || 'General',
    priority,
    status: assignedTechnician ? 'in_progress' : 'submitted',
    unit: unitId,
    tenant: tenantId,
    photoUrls,
    assignedTechnician: assignedTechnician || null,
    statusHistory: initialHistory,
  });

  await logAction({
    actorId: landlordId,
    action: 'TICKET_CREATED',
    entityId: ticket._id,
    afterState: ticket.toObject(),
    ipAddress,
  });

  if (tenantId && tenantId.toString() !== landlordId.toString()) {
    createNotification({
      userId: tenantId,
      title: `🔧 New Ticket: ${title.trim().slice(0, 40)}`,
      body: `A maintenance ticket was opened for your unit (${unit.label}): ${description.trim().slice(0, 100)}`,
      type: 'maintenance',
      refModel: 'Ticket',
      refId: ticket._id,
    });
  }

  return {
    ...ticket.toObject(),
    id: ticket._id,
    unitLabel: unit.label,
    propertyName: property.name,
  };
}

/**
 * UPDATE ticket status & transition workflow
 */
export async function updateTicketStatus(landlordId, ticketId, payload, ipAddress = '') {
  const { status, note, assignedTechnician } = payload;

  const validStatuses = ['submitted', 'acknowledged', 'in_progress', 'resolved', 'rejected', 'closed', 'cancelled'];
  if (status && !validStatuses.includes(status)) {
    throw new TicketError(`Invalid status. Allowed values: ${validStatuses.join(', ')}`, 400);
  }

  const ticket = await Ticket.findById(ticketId).populate('unit');
  if (!ticket) throw new TicketError('Ticket not found', 404);

  const property = await Property.findOne({ _id: ticket.unit.property, landlord: landlordId }).lean();
  if (!property) throw new TicketError('Access denied', 403);

  const beforeState = ticket.toObject();
  const nextStatus = status || ticket.status;

  ticket.status = nextStatus;

  if (assignedTechnician) {
    ticket.assignedTechnician = {
      name: assignedTechnician.name || ticket.assignedTechnician?.name || '',
      phone: assignedTechnician.phone || ticket.assignedTechnician?.phone || '',
      company: assignedTechnician.company || ticket.assignedTechnician?.company || '',
      eta: assignedTechnician.eta || ticket.assignedTechnician?.eta || '',
      rating: assignedTechnician.rating || 5,
    };
  }

  const historyEntry = {
    status: nextStatus,
    changedBy: landlordId,
    userRole: 'landlord',
    note: note || `Status updated to ${nextStatus.replace('_', ' ')}`,
    timestamp: new Date(),
  };

  ticket.statusHistory.push(historyEntry);
  await ticket.save();

  await logAction({
    actorId: landlordId,
    action: 'TICKET_STATUS_UPDATED',
    entityId: ticket._id,
    beforeState,
    afterState: ticket.toObject(),
    ipAddress,
  });

  if (ticket.tenant && ticket.tenant.toString() !== landlordId.toString()) {
    createNotification({
      userId: ticket.tenant,
      title: `🔧 Ticket Status: ${nextStatus.replace('_', ' ').toUpperCase()}`,
      body: note || `Maintenance ticket "${ticket.title}" status updated to ${nextStatus.replace('_', ' ')}.`,
      type: 'maintenance',
      refModel: 'Ticket',
      refId: ticket._id,
    });
  }

  return {
    ...ticket.toObject(),
    id: ticket._id,
  };
}

/**
 * ASSIGN technician to ticket
 */
export async function assignTechnician(landlordId, ticketId, technicianData, ipAddress = '') {
  const { name, phone, company, eta } = technicianData;

  if (!name?.trim()) throw new TicketError('Technician name is required', 400);

  const ticket = await Ticket.findById(ticketId).populate('unit');
  if (!ticket) throw new TicketError('Ticket not found', 404);

  const property = await Property.findOne({ _id: ticket.unit.property, landlord: landlordId }).lean();
  if (!property) throw new TicketError('Access denied', 403);

  const beforeState = ticket.toObject();

  ticket.assignedTechnician = {
    name: name.trim(),
    phone: phone?.trim() || '',
    company: company?.trim() || 'Direct Dispatch',
    eta: eta || 'Tomorrow, 9:00 AM - 1:00 PM',
    rating: 5,
  };

  if (ticket.status === 'submitted' || ticket.status === 'acknowledged') {
    ticket.status = 'in_progress';
  }

  ticket.statusHistory.push({
    status: ticket.status,
    changedBy: landlordId,
    userRole: 'landlord',
    note: `Assigned technician: ${name.trim()} (${company || 'Service Team'})`,
    timestamp: new Date(),
  });

  await ticket.save();

  await logAction({
    actorId: landlordId,
    action: 'TICKET_TECHNICIAN_ASSIGNED',
    entityId: ticket._id,
    beforeState,
    afterState: ticket.toObject(),
    ipAddress,
  });

  // Dispatch in-app notification & push notification to the tenant
  try {
    if (ticket.tenant) {
      createNotification({
        userId: ticket.tenant,
        title: `🔧 Technician Assigned`,
        body: `${name.trim()} (${company || 'Service Team'}) is dispatched. ETA: ${eta || 'TBD'}`,
        type: 'maintenance',
        refModel: 'Ticket',
        refId: ticket._id,
      });

      sendPushToUsers([ticket.tenant], {
        title: `🔧 Technician Assigned: ${ticket.title?.slice(0, 40) || 'Maintenance Request'}`,
        body: `${name.trim()} (${company || 'Service Team'}) is dispatched. ETA: ${eta || 'TBD'}`,
        url: '/tenant',
      }).catch((err) => console.error('Push dispatch error:', err.message));
    }
  } catch (err) {
    console.error('Technician push error:', err.message);
  }

  return {
    ...ticket.toObject(),
    id: ticket._id,
  };
}

/**
 * DELETE ticket
 */
export async function deleteTicket(landlordId, ticketId, ipAddress = '') {
  const ticket = await Ticket.findById(ticketId).populate('unit');
  if (!ticket) throw new TicketError('Ticket not found', 404);

  const property = await Property.findOne({ _id: ticket.unit.property, landlord: landlordId }).lean();
  if (!property) throw new TicketError('Access denied', 403);

  const beforeState = ticket.toObject();
  await Ticket.findByIdAndDelete(ticketId);

  await logAction({
    actorId: landlordId,
    action: 'TICKET_DELETED',
    entityId: ticketId,
    beforeState,
    afterState: null,
    ipAddress,
  });

  return {
    success: true,
    message: `Ticket "${ticket.title}" deleted successfully`,
    deletedTicketId: ticketId,
  };
}
