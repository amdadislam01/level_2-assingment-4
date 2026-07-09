export const restrictTo = (...roles) => {
  return (req, res, next) => {
    // req.user is set by the protect middleware
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden',
        errorDetails: `You do not have permission to perform this action. Required role: ${roles.join(' or ')}`,
      });
    }
    next();
  };
};
