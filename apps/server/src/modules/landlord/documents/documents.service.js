import Document from '../../../shared/models/document.model.js';
import Property from '../../../shared/models/property.model.js';
import Unit from '../../../shared/models/unit.model.js';
import User from '../../../shared/models/user.model.js';
import AuditLog from '../../../shared/models/auditLog.model.js';
import { getCloudinaryClient } from '../../../shared/config/cloudinary.js';

export class LandlordDocumentError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

async function logAction({ actorId, action, entityKind = 'Document', entityId, beforeState = null, afterState = null, ipAddress = '' }) {
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
    console.error('Landlord Document AuditLog error:', err.message);
  }
}

/**
 * GET all compliance documents across all units owned by landlord
 */
export async function getLandlordDocuments(landlordId, query = {}) {
  const { status, type, propertyId, search } = query;

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

  // 3. Build Document match filter
  const matchFilter = {
    $or: [
      { unit: { $in: unitIds } },
      { tenant: { $in: tenantIds } },
    ],
  };
  if (status && status !== 'all') {
    matchFilter.status = status;
  }
  if (type && type !== 'all') {
    matchFilter.type = type;
  }

  // 4. Query Documents
  const rawDocs = await Document.find(matchFilter)
    .populate('tenant', 'firstName lastName email phone')
    .populate('unit')
    .sort({ createdAt: -1 })
    .lean();

  // 5. Format documents with unit label & property name
  let formattedDocs = rawDocs.map((d) => {
    const unitIdStr = (d.unit?._id || d.unit)?.toString();
    const unitDoc = unitMap.get(unitIdStr) || (d.unit && typeof d.unit === 'object' ? d.unit : null);
    const propIdStr = (unitDoc?.property?._id || unitDoc?.property)?.toString();
    const propertyDoc = propIdStr ? propertyMap.get(propIdStr) : null;

    const tenantName = d.tenant
      ? `${d.tenant.firstName || ''} ${d.tenant.lastName || ''}`.trim() || d.tenant.email
      : 'Resident';

    return {
      ...d,
      id: d._id,
      unitId: unitDoc?._id || d.unit,
      unitLabel: unitDoc?.label || 'Unit N/A',
      propertyId: propertyDoc?._id || null,
      propertyName: propertyDoc?.name || 'Property N/A',
      tenantName,
      tenantEmail: d.tenant?.email || '',
      date: d.createdAt ? new Date(d.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'Recently',
    };
  });

  // 6. Search filter (if provided)
  if (search?.trim()) {
    const s = search.trim().toLowerCase();
    formattedDocs = formattedDocs.filter(
      (d) =>
        d.name?.toLowerCase().includes(s) ||
        d.type?.toLowerCase().includes(s) ||
        d.tenantName?.toLowerCase().includes(s) ||
        d.propertyName?.toLowerCase().includes(s) ||
        d.unitLabel?.toLowerCase().includes(s)
    );
  }

  // 7. Calculate compliance stats
  const totalCount = formattedDocs.length;
  const pendingCount = formattedDocs.filter((d) => d.status === 'Pending Review').length;
  const verifiedCount = formattedDocs.filter((d) => d.status === 'Verified').length;
  const rejectedCount = formattedDocs.filter((d) => d.status === 'Rejected').length;

  return {
    documents: formattedDocs,
    metrics: {
      total: totalCount,
      pendingReview: pendingCount,
      verified: verifiedCount,
      rejected: rejectedCount,
      complianceRate: totalCount > 0 ? Math.round((verifiedCount / totalCount) * 100) : 100,
    },
  };
}

/**
 * VERIFY or REJECT compliance document (Landlord)
 */
export async function verifyDocument(landlordId, docId, { status, rejectionReason = '' }, ipAddress = '') {
  if (!['Verified', 'Rejected'].includes(status)) {
    throw new LandlordDocumentError('Status must be either "Verified" or "Rejected"', 400);
  }

  const doc = await Document.findById(docId).populate('unit');
  if (!doc) throw new LandlordDocumentError('Document not found', 404);

  // Validate landlord ownership
  const property = await Property.findOne({ _id: doc.unit?.property, landlord: landlordId }).lean();
  if (!property) throw new LandlordDocumentError('Access denied', 403);

  const beforeState = doc.toObject();

  doc.status = status;
  doc.reviewedBy = landlordId;
  doc.verifiedAt = new Date();
  if (status === 'Rejected') {
    doc.rejectionReason = rejectionReason.trim() || 'Document does not satisfy compliance policy standards';
  } else {
    doc.rejectionReason = '';
  }

  await doc.save();

  await logAction({
    actorId: landlordId,
    action: status === 'Verified' ? 'DOCUMENT_VERIFIED' : 'DOCUMENT_REJECTED',
    entityId: doc._id,
    beforeState,
    afterState: doc.toObject(),
    ipAddress,
  });

  return {
    success: true,
    message: `Document has been marked as ${status}.`,
    document: { ...doc.toObject(), id: doc._id },
  };
}

/**
 * DELETE document (Landlord)
 */
export async function deleteDocument(landlordId, docId, ipAddress = '') {
  const doc = await Document.findById(docId).populate('unit');
  if (!doc) throw new LandlordDocumentError('Document not found', 404);

  const property = await Property.findOne({ _id: doc.unit?.property, landlord: landlordId }).lean();
  if (!property) throw new LandlordDocumentError('Access denied', 403);

  const beforeState = doc.toObject();
  await Document.findByIdAndDelete(docId);

  await logAction({
    actorId: landlordId,
    action: 'DOCUMENT_DELETED',
    entityId: docId,
    beforeState,
    afterState: null,
    ipAddress,
  });

  return {
    success: true,
    message: `Document "${doc.name}" removed from compliance vault.`,
    deletedDocId: docId,
  };
}

/**
 * STREAM a document file securely (Landlord)
 */
export async function getDocumentStream(landlordId, documentId) {
  const doc = await Document.findById(documentId).populate('unit').lean();
  if (!doc) throw new LandlordDocumentError('Document not found', 404);

  // Validate landlord ownership: landlord must own the property of the unit, or tenant must belong to landlord
  const unit = doc.unit ? await Unit.findById(doc.unit._id || doc.unit).populate('property').lean() : null;
  const isOwner = unit?.property?.landlord?.toString() === landlordId.toString();
  const tenant = await User.findById(doc.tenant).lean();
  const isTenantOfLandlord = tenant?.landlord?.toString() === landlordId.toString();

  if (!isOwner && !isTenantOfLandlord) {
    throw new LandlordDocumentError('Unauthorized to access this document', 403);
  }

  if (doc.fileUrl && doc.fileUrl.includes('cloudinary.com')) {
    const match = doc.fileUrl.match(/\/upload\/(?:v\d+\/)?(.+?)\.([a-zA-Z0-9]+)(?:\?.*)?$/i);
    if (match) {
      const publicId = match[1];
      const format = match[2];
      const client = getCloudinaryClient();
      if (client) {
        const downloadUrl = client.utils.private_download_url(publicId, format, {
          resource_type: 'image',
          type: 'upload',
        });
        const resp = await fetch(downloadUrl);
        if (resp.ok) {
          return {
            stream: resp.body,
            name: doc.name,
            mimeType: resp.headers.get('content-type') || (format.toLowerCase() === 'pdf' ? 'application/pdf' : `image/${format}`),
          };
        }
      }
    }
  }

  throw new LandlordDocumentError('Document file stream unavailable', 404);
}

