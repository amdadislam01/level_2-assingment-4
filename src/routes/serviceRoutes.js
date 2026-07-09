import express from 'express';
import {
  getAllServices,
  getService,
  createService,
  updateService,
  deleteService,
} from '../controllers/serviceController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { restrictTo } from '../middlewares/roleMiddleware.js';
import { validateService } from '../middlewares/validationMiddleware.js';

const router = express.Router();

router.get('/', getAllServices);
router.get('/:id', getService);

// Protected routes (Only Technicians or Admin can create, update, delete services)
router.use(protect);
router.use(restrictTo('TECHNICIAN', 'ADMIN'));

router.post('/', validateService, createService);
router.patch('/:id', updateService);
router.delete('/:id', deleteService);

export default router;
