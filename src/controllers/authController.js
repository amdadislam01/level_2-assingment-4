import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma.js';

// Get token signed with JWT secret
const signToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
    { expiresIn: '30d' }
  );
};

// Register a new customer or technician
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Check database for existing email
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Registration failed',
        errorDetails: 'Email is already in use.',
      });
    }

    // Encrypt password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Save user record
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || 'CUSTOMER',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    // Create an empty profile if user registered as a technician
    if (newUser.role === 'TECHNICIAN') {
      await prisma.technicianProfile.create({
        data: {
          userId: newUser.id,
          skills: [],
          experience: '0 years',
          pricing: 0.0,
        },
      });
    }

    const token = signToken(newUser.id);

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      data: {
        user: newUser,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Authenticate user credentials and return session token
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find the user details
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        success: false,
        message: 'Authentication failed',
        errorDetails: 'Incorrect email or password.',
      });
    }

    // Check if the user has been banned
    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        message: 'Account suspended',
        errorDetails: 'Your account has been banned by an administrator.',
      });
    }

    const token = signToken(user.id);

    // Filter password from response JSON
    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      token,
      data: {
        user: userWithoutPassword,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get profile of authenticated user
export const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        technicianProfile: true,
      },
    });

    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      success: true,
      data: {
        user: userWithoutPassword,
      },
    });
  } catch (error) {
    next(error);
  }
};
