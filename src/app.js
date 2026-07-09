import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import route definitions
import authRoutes from './routes/authRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import technicianRoutes from './routes/technicianRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';

dotenv.config();

const app = express();

// Enable CORS and body parsers
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check API
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to FixItNow Home Service Marketplace API',
    timestamp: new Date().toISOString(),
  });
});

// Register api blueprints
app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/technicians', technicianRoutes);
app.use('/api/technician', technicianRoutes); 
app.use('/api/reviews', reviewRoutes);

// 404 Page/Route not found handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'Not Found',
    errorDetails: `The requested endpoint ${req.originalUrl} does not exist on this server.`,
  });
});

// Unified error response handler
app.use((err, req, res, next) => {
  console.error(err.stack);

  const statusCode = err.status || err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    errorDetails: err.stack ? err.stack.split('\n')[0] : 'An unexpected error occurred.',
  });
});

export default app;
