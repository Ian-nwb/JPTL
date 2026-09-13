import { Router } from 'express';
import multer from 'multer';
import { requireAuth, requireRole } from '../../../shared/middleware/auth.middleware.js';
import * as tenantTicketController from './tickets.controller.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per photo
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'), false);
    }
    cb(null, true);
  },
});

const router = Router();

// Protect all routes: Tenant only
router.use(requireAuth, requireRole('tenant'));

router.post('/upload-photos', upload.array('photos', 5), tenantTicketController.uploadPhotos);
router.get('/', tenantTicketController.getTickets);
router.post('/', tenantTicketController.submitTicket);
router.get('/:id', tenantTicketController.getTicketById);
router.patch('/:id/cancel', tenantTicketController.cancelTicket);
router.post('/:id/comments', tenantTicketController.addComment);
router.delete('/:id', tenantTicketController.deleteTicket);

export default router;
