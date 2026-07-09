import express from 'express';
import {
  createCheckoutSession,
  confirmPayment,
  getPaymentHistory,
  getPaymentDetails,
} from '../controllers/paymentController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { restrictTo } from '../middlewares/roleMiddleware.js';

const router = express.Router();

// The confirmation endpoint must be public because Stripe redirects here
router.get('/confirm', confirmPayment);

// All other endpoints require authentication
router.use(protect);

router.post('/create-checkout-session', restrictTo('CUSTOMER'), createCheckoutSession);
router.get('/history', getPaymentHistory);
router.get('/:id', getPaymentDetails);

export default router;
