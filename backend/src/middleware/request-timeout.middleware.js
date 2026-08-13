export const requestTimeout = (req, res, next) => {
  req.setTimeout(30000);
  res.setTimeout(30000);
  next();
};