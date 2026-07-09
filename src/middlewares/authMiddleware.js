import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma.js';

export const protect = async (req, res, next) => {
  let token;

  // 1) Checking if token is in the headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized',
      errorDetails: 'You are not logged in. Please include a valid Bearer token in the Authorization header.',
    });
  }

  try {
    // 2) Verification of token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production');

    // 3) Check if user still exists
    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isBanned: true,
        createdAt: true,
      },
    });

    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
        errorDetails: 'The user belonging to this token no longer exists.',
      });
    }

    // 3b) Check if user is banned
    if (currentUser.isBanned) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden',
        errorDetails: 'Your account has been suspended or banned by an administrator.',
      });
    }

    // 4) Grant access to protected route
    req.user = currentUser;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized',
      errorDetails: 'Invalid or expired token. Access denied.',
    });
  }
};
