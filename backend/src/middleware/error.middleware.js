export const errorHandler = (err, req, res, _next) => {
  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    status: err.status || 'error',
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};