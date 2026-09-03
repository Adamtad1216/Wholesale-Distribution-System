import { Router } from 'express';
import { authenticate } from '../../../middleware/auth.middleware.js';
import * as personsController from './persons.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', personsController.getPersons);

export default router;
