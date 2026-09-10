export const validate = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.body || {});
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      const formattedMessage = Object.entries(fieldErrors)
        .map(([field, msgs]) => {
          const cleanMsgs = Array.isArray(msgs) ? msgs.join(', ') : msgs;
          return `${field}: ${cleanMsgs}`;
        })
        .join('; ');

      return res.status(400).json({
        status: 'error',
        message: formattedMessage || 'Validation failed',
        errors: fieldErrors,
      });
    }
    req.body = result.data;
    next();
  };
};