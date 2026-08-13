import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes.js';

const router = Router();

router.use('/v1/auth', authRoutes);

export const registerRoutes = (app) => {
  app.use('/api', router);
};