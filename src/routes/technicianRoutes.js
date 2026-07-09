import express from 'express';
import {
  getAllTechnicians,
  getTechnicianProfile,
  updateProfile,
  updateAvailability,
  getTechnicianBookings,
  updateTechnicianBookingStatus
} from '../controllers/technicianController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { restrictTo } from '../middlewares/roleMiddleware.js';
import {
  validateTechnicianProfileUpdate,
  validateTechnicianAvailabilityUpdate
} from '../middlewares/validationMiddleware.js';

const router = express.Router();

// Public routes for looking up technician profiles
router.get('/', getAllTechnicians);
router.get('/:id', getTechnicianProfile);

// Technician-only authenticated management routes
router.use(protect);
router.use(restrictTo('TECHNICIAN'));

router.put('/profile', validateTechnicianProfileUpdate, updateProfile);
router.put('/availability', validateTechnicianAvailabilityUpdate, updateAvailability);
router.get('/bookings', getTechnicianBookings);
router.patch('/bookings/:id', updateTechnicianBookingStatus);

export default router;
