import { AppError } from "../../../utils/errors.js";

export const getReports = async (req, res, next) => {
  try {
    next(new AppError("Not implemented", 501));
  } catch (err) {
    next(err);
  }
};

export const getReportById = async (req, res, next) => {
  try {
    next(new AppError("Not implemented", 501));
  } catch (err) {
    next(err);
  }
};

export const generateSalesReport = async (req, res, next) => {
  try {
    next(new AppError("Not implemented", 501));
  } catch (err) {
    next(err);
  }
};

export const generateDeliveryReport = async (req, res, next) => {
  try {
    next(new AppError("Not implemented", 501));
  } catch (err) {
    next(err);
  }
};
