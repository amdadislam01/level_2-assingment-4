import { prisma } from '../config/prisma.js';

export const createReview = async (req, res, next) => {
  try {
    const { technicianId, rating, comment } = req.body;

    // 1. Verify that the technician exists
    const technician = await prisma.technicianProfile.findUnique({
      where: { id: technicianId },
    });

    if (!technician) {
      return res.status(404).json({
        success: false,
        message: 'Technician not found',
        errorDetails: `No technician matches ID ${technicianId}`,
      });
    }

    // 2. Check if this customer has a COMPLETED booking with the technician
    const completedBooking = await prisma.booking.findFirst({
      where: {
        customerId: req.user.id,
        technicianId: technicianId,
        status: 'COMPLETED',
      },
    });

    if (!completedBooking) {
      return res.status(400).json({
        success: false,
        message: 'Review not allowed',
        errorDetails: 'You can only leave reviews for technicians who have completed a booking for you.',
      });
    }

    // 3. Create the review
    const review = await prisma.review.create({
      data: {
        customerId: req.user.id,
        technicianId,
        rating: parseInt(rating, 10),
        comment,
      },
      include: {
        customer: { select: { name: true } },
      },
    });

    // 4. Recalculate average rating for the technician profile
    const allReviews = await prisma.review.findMany({
      where: { technicianId },
      select: { rating: true },
    });

    const averageRating =
      allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    // Update the average rating on the Technician Profile
    await prisma.technicianProfile.update({
      where: { id: technicianId },
      data: { rating: parseFloat(averageRating.toFixed(1)) },
    });

    res.status(201).json({
      success: true,
      message: 'Review submitted and technician rating updated successfully.',
      data: { review },
    });
  } catch (error) {
    next(error);
  }
};
