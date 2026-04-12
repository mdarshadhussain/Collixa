/**
 * Global error handler middleware
 */
export const errorHandler = (error, req, res, next) => {
  console.error('Error:', error);

  // Default error response
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal server error';

  // Validation errors
  if (error.array && typeof error.array === 'function') {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.array(),
    });
  }

  // Custom error response
  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method,
  });
};

export default {
  errorHandler,
  notFoundHandler,
};
