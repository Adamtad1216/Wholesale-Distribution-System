import { AppError } from "../../utils/errors.js";

export const getQuotations = async (req, res, next) => {
  try {
    next(new AppError("Not implemented", 501));
  } catch (err) {
    next(err);
  }
};

export const getQuotationById = async (req, res, next) => {
  try {
    next(new AppError("Not implemented", 501));
  } catch (err) {
    next(err);
  }
};

export const createQuotation = async (req, res, next) => {
  try {
    next(new AppError("Not implemented", 501));
  } catch (err) {
    next(err);
  }
};

export const removeQuotation = async (req, res, next) => {
  try {
    next(new AppError("Not implemented", 501));
  } catch (err) {
    next(err);
  }
};
