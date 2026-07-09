import { prisma } from '../config/prisma.js';

// Get admin dashboard stats
export const getDashboardStats = async (req, res, next) => {
  try {
    const totalUsers = await prisma.user.count();
    const totalTechnicians = await prisma.technicianProfile.count();
    const totalBookings = await prisma.booking.count();
    const totalRevenue = await prisma.payment.aggregate({
      where: { status: 'COMPLETED' },
      _sum: {
        amount: true,
      },
    });

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalTechnicians,
          totalBookings,
          totalRevenue: totalRevenue._sum.amount || 0.0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Retrieve list of all registered users
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isBanned: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.status(200).json({
      success: true,
      results: users.length,
      data: { users },
    });
  } catch (error) {
    next(error);
  }
};

// Ban or unban a user
export const toggleUserBan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isBanned } = req.body;

    if (isBanned === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errorDetails: 'Please provide isBanned boolean field.',
      });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        errorDetails: `No user matches the ID ${id}`,
      });
    }

    // Admins shouldn't ban themselves
    if (user.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Action not allowed',
        errorDetails: 'You cannot ban your own administrator account.',
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isBanned },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isBanned: true,
      },
    });

    res.status(200).json({
      success: true,
      message: `User status updated to ${isBanned ? 'BANNED' : 'ACTIVE'} successfully.`,
      data: { user: updatedUser },
    });
  } catch (error) {
    next(error);
  }
};

// Delete user permanently
export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        errorDetails: `No user matches the ID ${id}`,
      });
    }

    await prisma.user.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: 'User deleted permanently.',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

// Get all bookings on the platform
export const getAllBookings = async (req, res, next) => {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        customer: { select: { name: true, email: true } },
        technician: { include: { user: { select: { name: true } } } },
        service: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.status(200).json({
      success: true,
      results: bookings.length,
      data: { bookings },
    });
  } catch (error) {
    next(error);
  }
};

// Fetch all service categories
export const getAllCategories = async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    });

    res.status(200).json({
      success: true,
      results: categories.length,
      data: { categories },
    });
  } catch (error) {
    next(error);
  }
};

// Create a new category
export const createCategory = async (req, res, next) => {
  try {
    const { name } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errorDetails: 'Category name is required.',
      });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // Avoid duplicates
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate category',
        errorDetails: `Category with slug "${slug}" already exists.`,
      });
    }

    const category = await prisma.category.create({
      data: { name, slug },
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully.',
      data: { category },
    });
  } catch (error) {
    next(error);
  }
};
