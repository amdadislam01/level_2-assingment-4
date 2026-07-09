import express from 'express';
import { createReview } from '../controllers/reviewController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { restrictTo } from '../middlewares/roleMiddleware.js';
import { validateReview } from '../middlewares/validationMiddleware.js';

const router = express.Router();

// Only logged in Customers can submit reviews
router.post('/', protect, restrictTo('CUSTOMER'), validateReview, createReview);

export default router;
