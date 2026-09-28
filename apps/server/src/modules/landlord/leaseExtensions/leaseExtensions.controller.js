import asyncHandler from '../../../shared/middleware/asyncHandler.middleware.js';
import * as leaseExtensionService from './leaseExtensions.service.js';

/**
 * GET /api/landlord/lease-extensions
 * List all lease extension requests across landlord properties
 * Query: ?status=pending|approved|rejected|all (default: all)
 */
export const getLandlordLeaseExtensions = asyncHandler(async (req, res) => {
  const landlordId = req.user._id || req.user.id;
  const result = await leaseExtensionService.getLandlordLeaseExtensions(landlordId, req.query);
  return res.status(200).json({ success: true, data: result });
});

/**
 * PATCH /api/landlord/lease-extensions/:leaseId/:extensionId
 * Approve or reject a tenant's lease extension request
 * Body: { action: 'approve'|'reject', landlordNotes?: string }
 */
export const reviewLeaseExtension = asyncHandler(async (req, res) => {
  const landlordId = req.user._id || req.user.id;
  const { leaseId, extensionId } = req.params;
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || '';
  const result = await leaseExtensionService.reviewLeaseExtension(
    landlordId,
    leaseId,
    extensionId,
    req.body,
    ipAddress
  );
  return res.status(200).json(result);
});
