import { AppError } from "../../../utils/errors.js";

export const getNotifications = async (req, res, next) => {
  try {
    next(new AppError("Not implemented", 501));
  } catch (err) {
    next(err);
  }
};

export const getNotificationById = async (req, res, next) => {
  try {
    next(new AppError("Not implemented", 501));
  } catch (err) {
    next(err);
  }
};

export const markNotificationAsRead = async (req, res, next) => {
  try {
    next(new AppError("Not implemented", 501));
  } catch (err) {
    next(err);
  }
};

export const markAllNotificationsAsRead = async (req, res, next) => {
  try {
    next(new AppError("Not implemented", 501));
  } catch (err) {
    next(err);
  }
};

export const removeNotification = async (req, res, next) => {
  try {
    next(new AppError("Not implemented", 501));
  } catch (err) {
    next(err);
  }
};
