import express from 'express';
import {
  createBooking,
  getBookings,
  getBooking,
  updateBookingStatus,
} from '../controllers/bookingController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { restrictTo } from '../middlewares/roleMiddleware.js';
import { validateBooking } from '../middlewares/validationMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/', restrictTo('CUSTOMER'), validateBooking, createBooking);
router.get('/', getBookings);
router.get('/:id', getBooking);
router.patch('/:id/status', updateBookingStatus);

export default router;
