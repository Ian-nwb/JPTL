import mongoose from 'mongoose';
import Lease from '../../../shared/models/lease.model.js';
import User from '../../../shared/models/user.model.js';
import Property from '../../../shared/models/property.model.js';
import Unit from '../../../shared/models/unit.model.js';
import AuditLog from '../../../shared/models/auditLog.model.js';
import { createNotification } from '../../../shared/services/notification.service.js';

export class LeaseExtensionError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

async function logAction({ actorId, action, entityId, beforeState = null, afterState = null, ipAddress = '' }) {
  try {
    await AuditLog.create({
      actor: actorId,
      actorRole: 'landlord',
      action,
      entityKind: 'Lease',
      entityId,
      beforeState,
      afterState,
      ipAddress,
    });
  } catch (err) {
    console.error('LeaseExtension AuditLog error:', err.message);
  }
}

/**
 * GET all lease extension requests across all landlord properties
 * Optionally filter by status: pending | approved | rejected | all
 */
export async function getLandlordLeaseExtensions(landlordId, query = {}) {
  const { status = 'all' } = query;

  // Find all leases belonging to this landlord that have extension requests
  const leases = await Lease.find({ landlord: landlordId })
    .populate('tenant', 'firstName lastName email phone')
    .populate('unit', 'label')
    .populate('property', 'name address')
    .lean();

  const results = [];

  for (const lease of leases) {
    if (!lease.extensionRequests || lease.extensionRequests.length === 0) continue;

    const filteredRequests =
      status === 'all'
        ? lease.extensionRequests
        : lease.extensionRequests.filter((r) => r.status === status);

    if (filteredRequests.length === 0) continue;

    results.push({
      leaseId: lease._id,
      leaseStatus: lease.status,
      leaseEnd: lease.leaseEnd,
      monthlyRent: lease.monthlyRent,
      tenant: lease.tenant
        ? {
            id: lease.tenant._id,
            name: `${lease.tenant.firstName || ''} ${lease.tenant.lastName || ''}`.trim() || lease.tenant.email,
            email: lease.tenant.email,
            phone: lease.tenant.phone || '',
          }
        : null,
      unit: lease.unit ? { id: lease.unit._id, label: lease.unit.label } : null,
      property: lease.property ? { id: lease.property._id, name: lease.property.name, address: lease.property.address } : null,
      extensionRequests: filteredRequests.map((r) => ({
        ...r,
        id: r._id,
      })),
    });
  }

  // Sort: pending first, then by requestedAt desc
  results.sort((a, b) => {
    const aHasPending = a.extensionRequests.some((r) => r.status === 'pending');
    const bHasPending = b.extensionRequests.some((r) => r.status === 'pending');
    if (aHasPending && !bHasPending) return -1;
    if (!aHasPending && bHasPending) return 1;
    return 0;
  });

  return { total: results.length, extensions: results };
}

/**
 * PATCH approve or reject a specific extension request
 */
export async function reviewLeaseExtension(landlordId, leaseId, extensionId, payload, ipAddress = '') {
  const { action, landlordNotes = '' } = payload;

  if (!['approve', 'reject'].includes(action)) {
    throw new LeaseExtensionError('action must be "approve" or "reject"', 400);
  }

  const lease = await Lease.findOne({ _id: leaseId, landlord: landlordId });
  if (!lease) throw new LeaseExtensionError('Lease not found or access denied', 404);

  const ext = lease.extensionRequests.id(extensionId);
  if (!ext) throw new LeaseExtensionError('Extension request not found', 404);
  if (ext.status !== 'pending') {
    if (
      (action === 'approve' && ext.status === 'approved') ||
      (action === 'reject' && ext.status === 'rejected')
    ) {
      return {
        success: true,
        action,
        leaseId: lease._id,
        extensionId: ext._id,
        newLeaseEnd: action === 'approve' ? lease.leaseEnd : undefined,
        leaseStatus: lease.status,
        message: action === 'approve'
          ? `Extension approved. Lease extended to ${new Date(lease.leaseEnd).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}.`
          : 'Extension request rejected.',
      };
    }
    throw new LeaseExtensionError(`This request has already been ${ext.status}`, 400);
  }

  const beforeState = lease.toObject();
  const now = new Date();

  ext.reviewedAt = now;
  ext.reviewedBy = new mongoose.Types.ObjectId(landlordId);
  ext.landlordNotes = landlordNotes.trim();

  if (action === 'approve') {
    ext.status = 'approved';
    lease.leaseEnd = ext.proposedEndDate;
    lease.monthlyRent = ext.monthlyRent;
    lease.status = 'active'; // reset to active after approval
  } else {
    ext.status = 'rejected';
    lease.status = 'renewal_rejected';
  }

  await lease.save();

  await logAction({
    actorId: landlordId,
    action: action === 'approve' ? 'LEASE_EXTENSION_APPROVED' : 'LEASE_EXTENSION_REJECTED',
    entityId: lease._id,
    beforeState,
    afterState: lease.toObject(),
    ipAddress,
  });

  // Notify tenant
  try {
    const tenantId = lease.tenant;
    if (action === 'approve') {
      createNotification({
        userId: tenantId,
        title: '🎉 Lease Extension Approved!',
        body: `Your ${ext.termMonths}-month lease extension has been approved. New end date: ${new Date(ext.proposedEndDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.`,
        type: 'lease',
        refModel: 'Lease',
        refId: lease._id,
      });
    } else {
      createNotification({
        userId: tenantId,
        title: '📋 Lease Extension Update',
        body: `Your ${ext.termMonths}-month lease extension request was not approved.${landlordNotes ? ` Note: ${landlordNotes}` : ''}`,
        type: 'lease',
        refModel: 'Lease',
        refId: lease._id,
      });
    }
  } catch (err) {
    console.error('Lease extension notification error:', err.message);
  }

  return {
    success: true,
    action,
    leaseId: lease._id,
    extensionId: ext._id,
    newLeaseEnd: action === 'approve' ? lease.leaseEnd : undefined,
    leaseStatus: lease.status,
    message: action === 'approve'
      ? `Extension approved. Lease extended to ${new Date(lease.leaseEnd).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}.`
      : 'Extension request rejected.',
  };
}
