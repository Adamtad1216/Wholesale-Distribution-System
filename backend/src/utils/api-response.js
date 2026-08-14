export const sendSuccess = (res, data, statusCode = 200) => {
  return res.status(statusCode).json({
    status: 'success',
    data,
  });
};

export const sendPaginatedSuccess = (res, data, meta, statusCode = 200) => {
  return res.status(statusCode).json({
    status: 'success',
    data,
    meta,
  });
};

export const sendError = (res, message, statusCode = 500) => {
  return res.status(statusCode).json({
    status: 'error',
    message,
  });
};

export const sendCreated = (res, data) => {
  return res.status(201).json({
    status: 'success',
    data,
  });
};