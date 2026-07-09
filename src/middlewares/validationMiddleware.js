// Custom validation helper middleware
// Checks input data format and returns clean, consistent JSON error responses

export const validateRegister = (req, res, next) => {
  const { name, email, password, role } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errorDetails: 'Full name must be at least 2 characters long.',
    });
  }

  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errorDetails: 'Please provide a valid email address.',
    });
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errorDetails: 'Password must be at least 6 characters long.',
    });
  }

  if (role && !['CUSTOMER', 'TECHNICIAN', 'ADMIN'].includes(role)) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errorDetails: 'Role must be one of: CUSTOMER, TECHNICIAN, ADMIN.',
    });
  }

  next();
};

export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errorDetails: 'Please provide a valid email address.',
    });
  }

  if (!password || typeof password !== 'string' || password.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errorDetails: 'Password is required.',
    });
  }

  next();
};

export const validateService = (req, res, next) => {
  const { name, description, price, categoryId } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length < 3) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errorDetails: 'Service name must be at least 3 characters long.',
    });
  }

  if (!description || typeof description !== 'string' || description.trim().length < 10) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errorDetails: 'Description must be at least 10 characters long.',
    });
  }

  const numericPrice = parseFloat(price);
  if (isNaN(numericPrice) || numericPrice <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errorDetails: 'Price must be a valid number greater than 0.',
    });
  }

  if (!categoryId || typeof categoryId !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errorDetails: 'Please select a valid service category.',
    });
  }

  next();
};

export const validateBooking = (req, res, next) => {
  const { serviceId, scheduledTime } = req.body;

  if (!serviceId || typeof serviceId !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errorDetails: 'Please provide a valid service ID.',
    });
  }

  if (!scheduledTime || isNaN(Date.parse(scheduledTime))) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errorDetails: 'Please provide a valid scheduled date and time.',
    });
  }

  if (new Date(scheduledTime) < new Date()) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errorDetails: 'Booking scheduled time must be in the future.',
    });
  }

  next();
};

export const validateReview = (req, res, next) => {
  const { technicianId, rating, comment } = req.body;

  if (!technicianId || typeof technicianId !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errorDetails: 'Technician ID is required.',
    });
  }

  const numericRating = parseInt(rating, 10);
  if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errorDetails: 'Rating must be an integer between 1 and 5.',
    });
  }

  if (comment && typeof comment !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errorDetails: 'Comment must be a text value.',
    });
  }

  next();
};

export const validateTechnicianProfileUpdate = (req, res, next) => {
  const { skills, experience, pricing, location } = req.body;

  if (skills && (!Array.isArray(skills) || skills.some(s => typeof s !== 'string'))) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errorDetails: 'Skills must be an array of strings.',
    });
  }

  if (experience && typeof experience !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errorDetails: 'Experience must be a text description.',
    });
  }

  if (pricing !== undefined) {
    const numericPricing = parseFloat(pricing);
    if (isNaN(numericPricing) || numericPricing < 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errorDetails: 'Pricing must be a non-negative number.',
      });
    }
  }

  if (location && typeof location !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errorDetails: 'Location must be a text value.',
    });
  }

  next();
};

export const validateTechnicianAvailabilityUpdate = (req, res, next) => {
  const { availability } = req.body;

  if (!availability || !Array.isArray(availability) || availability.some(a => typeof a !== 'string')) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errorDetails: 'Availability must be a valid array of day/time strings.',
    });
  }

  next();
};
