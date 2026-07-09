import express from 'express';
import {
  getDashboardStats,
  getAllUsers,
  toggleUserBan,
  deleteUser,
  getAllBookings,
  getAllCategories,
  createCategory,
} from '../controllers/adminController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { restrictTo } from '../middlewares/roleMiddleware.js';

const router = express.Router();

// All admin routes require login and ADMIN role permissions
router.use(protect);
router.use(restrictTo('ADMIN'));

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.patch('/users/:id/ban', toggleUserBan);
router.delete('/users/:id', deleteUser);

router.get('/bookings', getAllBookings);

router.get('/categories', getAllCategories);
router.post('/categories', createCategory);

export default router;
