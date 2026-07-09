import { prisma } from '../config/prisma.js';

// Get list of all technicians with filters
export const getAllTechnicians = async (req, res, next) => {
  try {
    const { skill, location, minRating, maxPrice } = req.query;

    const filter = {};

    // Filter by specific skill
    if (skill) {
      filter.skills = {
        has: skill
      };
    }

    // Filter by location
    if (location) {
      filter.location = {
        contains: location,
        mode: 'insensitive'
      };
    }

    // Filter by rating
    if (minRating) {
      filter.rating = {
        gte: parseFloat(minRating)
      };
    }

    // Filter by max pricing hourly rate
    if (maxPrice) {
      filter.pricing = {
        lte: parseFloat(maxPrice)
      };
    }

    // Get list including user basic info
    const technicians = await prisma.technicianProfile.findMany({
      where: filter,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            isBanned: true
          }
        }
      }
    });

    // Don't show technicians whose user account is banned
    const activeTechnicians = technicians.filter(tech => !tech.user.isBanned);

    res.status(200).json({
      success: true,
      results: activeTechnicians.length,
      data: {
        technicians: activeTechnicians
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get a single technician's profile with their services and reviews
export const getTechnicianProfile = async (req, res, next) => {
  try {
    const { id } = req.params;

    const technician = await prisma.technicianProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            isBanned: true
          }
        },
        services: true,
        reviews: {
          include: {
            customer: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    // Check if technician exists and is not banned
    if (!technician || technician.user.isBanned) {
      return res.status(404).json({
        success: false,
        message: 'Technician not found',
        errorDetails: 'The requested technician profile does not exist or has been disabled.'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        technician
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update technician's profile details
export const updateProfile = async (req, res, next) => {
  try {
    const { skills, experience, pricing, location } = req.body;

    // Find the technician profile linked to the logged-in user
    const profile = await prisma.technicianProfile.findUnique({
      where: { userId: req.user.id }
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found',
        errorDetails: 'Only registered technicians can update this profile.'
      });
    }

    // Save changes to database
    const updatedProfile = await prisma.technicianProfile.update({
      where: { id: profile.id },
      data: {
        skills: skills !== undefined ? skills : undefined,
        experience: experience !== undefined ? experience : undefined,
        pricing: pricing !== undefined ? parseFloat(pricing) : undefined,
        location: location !== undefined ? location : undefined
      }
    });

    res.status(200).json({
      success: true,
      message: 'Your profile has been updated successfully.',
      data: {
        profile: updatedProfile
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update technician's weekly availability slots
export const updateAvailability = async (req, res, next) => {
  try {
    const { availability } = req.body;

    const profile = await prisma.technicianProfile.findUnique({
      where: { userId: req.user.id }
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found',
        errorDetails: 'Technician profile not found.'
      });
    }

    const updatedProfile = await prisma.technicianProfile.update({
      where: { id: profile.id },
      data: {
        availability
      }
    });

    res.status(200).json({
      success: true,
      message: 'Availability slots updated successfully.',
      data: {
        profile: updatedProfile
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get all bookings assigned to the logged-in technician
export const getTechnicianBookings = async (req, res, next) => {
  try {
    const profile = await prisma.technicianProfile.findUnique({
      where: { userId: req.user.id }
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found',
        errorDetails: 'Technician profile not found.'
      });
    }

    const bookings = await prisma.booking.findMany({
      where: { technicianId: profile.id },
      include: {
        customer: {
          select: {
            name: true,
            email: true
          }
        },
        service: true
      },
      orderBy: {
        scheduledTime: 'asc'
      }
    });

    res.status(200).json({
      success: true,
      results: bookings.length,
      data: {
        bookings
      }
    });
  } catch (error) {
    next(error);
  }
};

// Accept, decline, or complete a booking request
export const updateTechnicianBookingStatus = async (req, res, next) => {
  try {
    const { id } = req.params; // booking ID
    const { status } = req.body; // e.g. ACCEPTED, DECLINED, IN_PROGRESS, COMPLETED

    // Only allow specific technician statuses
    const allowedStatuses = ['ACCEPTED', 'DECLINED', 'IN_PROGRESS', 'COMPLETED'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
        errorDetails: `Technicians can only update status to: ${allowedStatuses.join(', ')}`
      });
    }

    const profile = await prisma.technicianProfile.findUnique({
      where: { userId: req.user.id }
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found',
        errorDetails: 'Technician profile not found.'
      });
    }

    // Fetch the target booking
    const booking = await prisma.booking.findUnique({
      where: { id }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
        errorDetails: `No booking matches the ID ${id}`
      });
    }

    // Verify this booking belongs to the current technician
    if (booking.technicianId !== profile.id) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden',
        errorDetails: 'You cannot update bookings that are assigned to other technicians.'
      });
    }

    // Status transition validation checks
    if (status === 'IN_PROGRESS' && booking.status !== 'PAID') {
      return res.status(400).json({
        success: false,
        message: 'Cannot start job',
        errorDetails: 'You can only mark a job as IN_PROGRESS after the customer has paid.'
      });
    }

    if (status === 'COMPLETED' && booking.status !== 'IN_PROGRESS') {
      return res.status(400).json({
        success: false,
        message: 'Cannot complete job',
        errorDetails: 'You can only complete a job that is currently IN_PROGRESS.'
      });
    }

    // Save updated status
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: { status }
    });

    res.status(200).json({
      success: true,
      message: `Booking status updated to ${status} successfully.`,
      data: {
        booking: updatedBooking
      }
    });
  } catch (error) {
    next(error);
  }
};
