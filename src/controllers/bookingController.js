import { prisma } from '../config/prisma.js';

// Customer creates a new service booking
export const createBooking = async (req, res, next) => {
  try {
    const { serviceId, scheduledTime } = req.body;

    if (!serviceId || !scheduledTime) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errorDetails: 'Please provide serviceId and scheduledTime.',
      });
    }

    // Fetch the service to find its technician
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        technician: {
          include: {
            user: {
              select: { isBanned: true }
            }
          }
        }
      }
    });

    if (!service || service.technician.user.isBanned) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
        errorDetails: `No active service matches the ID ${serviceId}`,
      });
    }

    const booking = await prisma.booking.create({
      data: {
        customerId: req.user.id,
        technicianId: service.technicianId,
        serviceId,
        scheduledTime: new Date(scheduledTime),
        status: 'REQUESTED',
      },
    });

    res.status(201).json({
      success: true,
      message: 'Booking request sent successfully.',
      data: { booking },
    });
  } catch (error) {
    next(error);
  }
};

// Get list of bookings (different view for admin, technician, customer)
export const getBookings = async (req, res, next) => {
  try {
    let bookings;

    if (req.user.role === 'ADMIN') {
      bookings = await prisma.booking.findMany({
        include: {
          customer: { select: { name: true, email: true } },
          technician: { include: { user: { select: { name: true } } } },
          service: true
        },
        orderBy: { createdAt: 'desc' }
      });
    } else if (req.user.role === 'TECHNICIAN') {
      const profile = await prisma.technicianProfile.findUnique({
        where: { userId: req.user.id },
      });

      if (!profile) {
        return res.status(404).json({
          success: false,
          message: 'Profile not found',
          errorDetails: 'Technician profile not found.',
        });
      }

      bookings = await prisma.booking.findMany({
        where: { technicianId: profile.id },
        include: {
          customer: { select: { name: true, email: true } },
          service: true
        },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      // CUSTOMER
      bookings = await prisma.booking.findMany({
        where: { customerId: req.user.id },
        include: {
          technician: { include: { user: { select: { name: true } } } },
          service: true
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    res.status(200).json({
      success: true,
      results: bookings.length,
      data: { bookings },
    });
  } catch (error) {
    next(error);
  }
};

// Retrieve a single booking details
export const getBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        customer: { select: { name: true, email: true } },
        technician: { include: { user: { select: { name: true, email: true } } } },
        service: true,
        payments: true,
      },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
        errorDetails: `No booking matches the ID ${id}`,
      });
    }

    // Verify authorized access
    const profile = await prisma.technicianProfile.findUnique({
      where: { userId: req.user.id },
    });

    const isCustomer = booking.customerId === req.user.id;
    const isTechnician = profile && booking.technicianId === profile.id;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isCustomer && !isTechnician && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        errorDetails: 'You do not have permission to view this booking.',
      });
    }

    res.status(200).json({
      success: true,
      data: { booking },
    });
  } catch (error) {
    next(error);
  }
};

// Modify booking status (customer can cancel before IN_PROGRESS)
export const updateBookingStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ['REQUESTED', 'ACCEPTED', 'DECLINED', 'PAID', 'IN_PROGRESS', 'COMPLETED'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errorDetails: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}`,
      });
    }

    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
        errorDetails: `No booking matches the ID ${id}`,
      });
    }

    const profile = await prisma.technicianProfile.findUnique({
      where: { userId: req.user.id },
    });

    const isCustomer = booking.customerId === req.user.id;
    const isTechnician = profile && booking.technicianId === profile.id;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isCustomer && !isTechnician && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        errorDetails: 'You do not have permission to modify this booking.',
      });
    }

    // Customer cancellation constraint
    if (isCustomer && !isAdmin && !isTechnician) {
      if (status !== 'DECLINED') {
        return res.status(400).json({
          success: false,
          message: 'Action not allowed',
          errorDetails: 'Customers can only cancel (set status to DECLINED) their own bookings.',
        });
      }

      // Customer can cancel a booking at any point before it reaches IN_PROGRESS status
      const unacceptableCancellationStatuses = ['IN_PROGRESS', 'COMPLETED'];
      if (unacceptableCancellationStatuses.includes(booking.status)) {
        return res.status(400).json({
          success: false,
          message: 'Cancellation not allowed',
          errorDetails: `You cannot cancel a booking once it is ${booking.status}.`,
        });
      }
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: { status },
    });

    res.status(200).json({
      success: true,
      message: `Booking status updated to ${status} successfully.`,
      data: { booking: updatedBooking },
    });
  } catch (error) {
    next(error);
  }
};
