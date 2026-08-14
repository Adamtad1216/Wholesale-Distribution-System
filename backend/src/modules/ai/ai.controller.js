import { sendSuccess, sendError } from "../../utils/api-response.js";
import { AppError } from "../../utils/errors.js";

export const submitAiQuery = async (req, res, next) => {
  try {
    next(new AppError("Not implemented", 501));
  } catch (err) {
    next(err);
  }
};

export const getAiQueries = async (req, res, next) => {
  try {
    next(new AppError("Not implemented", 501));
  } catch (err) {
    next(err);
  }
};

export const getAiQueryById = async (req, res, next) => {
  try {
    next(new AppError("Not implemented", 501));
  } catch (err) {
    next(err);
  }
};

export const getAiRecommendations = async (req, res, next) => {
  try {
    next(new AppError("Not implemented", 501));
  } catch (err) {
    next(err);
  }
};
