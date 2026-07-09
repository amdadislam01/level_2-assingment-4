import Stripe from 'stripe';
import { prisma } from '../config/prisma.js';

// Initialize stripe with key from env or fallback
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key_please_configure_stripe');

export const createCheckoutSession = async (req, res, next) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errorDetails: 'Booking ID is required.',
      });
    }

    // Fetch the booking details including the service price
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { service: true },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
        errorDetails: `No booking matches the ID ${bookingId}`,
      });
    }

    // Security check: Only the booking customer can make the payment
    if (booking.customerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden',
        errorDetails: 'You cannot perform payment on another customer\'s booking.',
      });
    }

    // Status check: Payment can only be made if the booking was accepted by the technician
    if (booking.status !== 'ACCEPTED') {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking status',
        errorDetails: `Payments are only allowed for ACCEPTED bookings. Current status is ${booking.status}`,
      });
    }

    // Generate Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: booking.service.name,
              description: booking.service.description,
            },
            unit_amount: Math.round(booking.service.price * 100), // Stripe expects unit amount in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      // Success URL pointing to the confirmation API endpoint
      success_url: `${req.protocol}://${req.get('host')}/api/payments/confirm?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.protocol}://${req.get('host')}/api/payments/cancel`,
      metadata: {
        bookingId: booking.id,
        customerId: req.user.id,
      },
    });

    // Save a pending payment transaction record in our database
    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: booking.service.price,
        provider: 'STRIPE',
        transactionId: session.id, // Store Stripe Session ID as initial transaction reference
        status: 'PENDING',
      },
    });

    res.status(201).json({
      success: true,
      message: 'Stripe checkout session initialized successfully.',
      data: {
        sessionId: session.id,
        checkoutUrl: session.url,
      },
    });
  } catch (error) {
    // If Stripe config is invalid, provide a clear error message but don't crash
    if (error.message.includes('apiKey')) {
      return res.status(500).json({
        success: false,
        message: 'Stripe Configuration Error',
        errorDetails: 'Please verify the STRIPE_SECRET_KEY is correctly set in your .env file.',
      });
    }
    next(error);
  }
};

export const confirmPayment = async (req, res, next) => {
  try {
    const { session_id } = req.query;

    if (!session_id) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed',
        errorDetails: 'Missing session_id parameter.',
      });
    }

    // Retrieve full session details from Stripe to verify status
    let session;
    try {
      session = await stripe.checkout.sessions.retrieve(session_id);
    } catch (stripeError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Stripe Session',
        errorDetails: stripeError.message || 'The provided session_id does not exist or is invalid on Stripe.',
      });
    }

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
        errorDetails: 'Stripe checkout session could not be retrieved.',
      });
    }

    if (session.payment_status !== 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Payment incomplete',
        errorDetails: `The Stripe checkout session status is ${session.payment_status}.`,
      });
    }

    const bookingId = session.metadata.bookingId;

    // Find the corresponding payment record in our DB using either session_id or payment_intent
    const payment = await prisma.payment.findFirst({
      where: {
        OR: [
          { transactionId: session_id },
          { transactionId: session.payment_intent || '' }
        ]
      },
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found',
        errorDetails: `Could not locate a pending transaction for Stripe session ${session_id}.`,
      });
    }

    // If it's already marked completed, just return it
    if (payment.status === 'COMPLETED') {
      return res.status(200).json({
        success: true,
        message: 'Payment was already verified and processed.',
        data: { payment },
      });
    }

    // Perform database updates inside transaction to keep consistency
    const [updatedPayment, updatedBooking] = await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'COMPLETED',
          transactionId: session.payment_intent || session_id,
          paidAt: new Date(),
        },
      }),
      prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'PAID' },
      }),
    ]);

    res.status(200).json({
      success: true,
      message: 'Payment completed successfully and booking status updated to PAID.',
      data: {
        payment: updatedPayment,
        booking: updatedBooking,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getPaymentHistory = async (req, res, next) => {
  try {
    let payments;

    if (req.user.role === 'ADMIN') {
      payments = await prisma.payment.findMany({
        include: { booking: { include: { service: true } } },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      // Return payments corresponding only to this customer's bookings
      payments = await prisma.payment.findMany({
        where: {
          booking: {
            customerId: req.user.id,
          },
        },
        include: { booking: { include: { service: true } } },
        orderBy: { createdAt: 'desc' },
      });
    }

    res.status(200).json({
      success: true,
      results: payments.length,
      data: { payments },
    });
  } catch (error) {
    next(error);
  }
};

export const getPaymentDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: { booking: { include: { service: true, customer: { select: { name: true, email: true } } } } },
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
        errorDetails: `No transaction matches the ID ${id}`,
      });
    }

    // Access check: Admin can view any payment. Customers can view their own.
    if (req.user.role !== 'ADMIN' && payment.booking.customerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        errorDetails: 'You do not have permission to view this payment information.',
      });
    }

    res.status(200).json({
      success: true,
      data: { payment },
    });
  } catch (error) {
    next(error);
  }
};
