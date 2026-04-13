export const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation error',
      details: Object.values(err.errors).map(e => e.message),
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid ID format' });
  }

  if (err.code === 11000) {
    return res.status(400).json({ error: 'Duplicate field value entered' });
  }

  return res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
};

export const notFound = (req, res) => {
  res.status(404).json({ error: 'Route not found' });
};
