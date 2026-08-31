import { Router } from 'express';
import { authenticate } from '../../../middleware/auth.middleware.js';
import { requirePermission } from '../../../middleware/permission.middleware.js';
import { validate } from '../../../middleware/validation.middleware.js';
import * as permissionsController from './permissions.controller.js';
import { createPermissionSchema, updatePermissionSchema } from './permissions.validation.js';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/v1/permissions:
 *   get:
 *     tags: ["01 - Permissions"]
 *     summary: List all permissions
 *     description: Retrieve a list of all active permissions in the system.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of permissions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       name:
 *                         type: string
 *                       module:
 *                         type: string
 *                       action:
 *                         type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  '/',
  requirePermission('permissions:read'),
  permissionsController.getPermissions
);

/**
 * @swagger
 * /api/v1/permissions/{id}:
 *   get:
 *     tags: ["01 - Permissions"]
 *     summary: Get permission by ID
 *     description: Retrieve detailed information for a specific permission.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Permission details
 *       404:
 *         description: Permission not found
 */
router.get(
  '/:id',
  requirePermission('permissions:read'),
  permissionsController.getPermission
);

/**
 * @swagger
 * /api/v1/permissions:
 *   post:
 *     tags: ["01 - Permissions"]
 *     summary: Create a new permission
 *     description: Create a new permission definition.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, module, action]
 *             properties:
 *               name:
 *                 type: string
 *                 example: 'permissions:read'
 *               module:
 *                 type: string
 *                 example: 'Permissions'
 *               action:
 *                 type: string
 *                 example: 'Read'
 *               description:
 *                 type: string
 *                 example: 'View permission details'
 *     responses:
 *       201:
 *         description: Permission created successfully
 *       409:
 *         description: Permission name already exists
 */
router.post(
  '/',
  requirePermission('permissions:write'),
  validate(createPermissionSchema),
  permissionsController.createPermission
);

/**
 * @swagger
 * /api/v1/permissions/{id}:
 *   patch:
 *     tags: ["01 - Permissions"]
 *     summary: Update a permission
 *     description: Update permission details.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               module:
 *                 type: string
 *               action:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Permission updated successfully
 *       404:
 *         description: Permission not found
 */
router.patch(
  '/:id',
  requirePermission('permissions:write'),
  validate(updatePermissionSchema),
  permissionsController.updatePermission
);

/**
 * @swagger
 * /api/v1/permissions/{id}:
 *   delete:
 *     tags: ["01 - Permissions"]
 *     summary: Delete a permission
 *     description: Soft-delete a permission by ID.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Permission deleted successfully
 *       404:
 *         description: Permission not found
 */
router.delete(
  '/:id',
  requirePermission('permissions:delete'),
  permissionsController.deletePermission
);

export default router;
