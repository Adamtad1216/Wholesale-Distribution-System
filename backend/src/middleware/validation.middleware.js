export const validate = (schema, source) => {
  return (req, res, next) => {
    let dataToValidate;
    if (source === 'params') {
      dataToValidate = req.params;
    } else if (source === 'query') {
      dataToValidate = req.query;
    } else if (source === 'body') {
      dataToValidate = req.body || {};
    } else if (req.method === 'GET' || req.method === 'DELETE') {
      dataToValidate = { ...req.query, ...req.params };
    } else {
      dataToValidate = { ...req.params, ...(req.body || {}) };
    }

    const result = schema.safeParse(dataToValidate);
    if (!result.success) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: result.error.flatten().fieldErrors,
      });
    }
    if (req.method !== 'GET' && req.method !== 'DELETE') {
      req.body = result.data;
    }
    next();
  };
};