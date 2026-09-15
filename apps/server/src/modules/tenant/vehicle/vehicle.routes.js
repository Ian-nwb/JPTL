import { Router } from 'express';
import vehicleController from './vehicle.controller.js';
import { requireAuth } from '../../../shared/middleware/auth.middleware.js';

const router = Router();

router.get('/', requireAuth, vehicleController.getVehicles);
router.post('/', requireAuth, vehicleController.createVehicle);
router.delete('/:id', requireAuth, vehicleController.deleteVehicle);

export default router;