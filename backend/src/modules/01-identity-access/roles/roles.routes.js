import { Router } from 'express';
import { authenticate } from '../../../middleware/auth.middleware.js';
import { requirePermission } from '../../../middleware/permission.middleware.js';
import { validate } from '../../../middleware/validation.middleware.js';
import * as rolesController from './roles.controller.js';
import { createRoleSchema, updateRoleSchema, assignPermissionSchema } from './roles.validation.js';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/v1/roles:
 *   get:
 *     tags: ["01 - Roles"]
 *     summary: List all roles
 *     description: Retrieve a list of all active roles in the system, including their permissions.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of roles
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  '/',
  requirePermission('roles:read'),
  rolesController.getRoles
);

/**
 * @swagger
 * /api/v1/roles/{id}:
 *   get:
 *     tags: ["01 - Roles"]
 *     summary: Get role by ID
 *     description: Retrieve detailed information for a specific role, including assigned permissions.
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
 *         description: Role details
 *       404:
 *         description: Role not found
 */
router.get(
  '/:id',
  requirePermission('roles:read'),
  rolesController.getRole
);

/**
 * @swagger
 * /api/v1/roles:
 *   post:
 *     tags: ["01 - Roles"]
 *     summary: Create a new role
 *     description: Create a new system role.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: 'Administrator'
 *               description:
 *                 type: string
 *                 example: 'Full access to all system features'
 *     responses:
 *       201:
 *         description: Role created successfully
 *       409:
 *         description: Role name already exists
 */
router.post(
  '/',
  requirePermission('roles:write'),
  validate(createRoleSchema),
  rolesController.createRole
);

/**
 * @swagger
 * /api/v1/roles/{id}:
 *   patch:
 *     tags: ["01 - Roles"]
 *     summary: Update a role
 *     description: Update role details.
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
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Role updated successfully
 *       404:
 *         description: Role not found
 */
router.patch(
  '/:id',
  requirePermission('roles:write'),
  validate(updateRoleSchema),
  rolesController.updateRole
);

/**
 * @swagger
 * /api/v1/roles/{id}:
 *   delete:
 *     tags: ["01 - Roles"]
 *     summary: Delete a role
 *     description: Soft-delete a role by ID.
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
 *         description: Role deleted successfully
 *       404:
 *         description: Role not found
 */
router.delete(
  '/:id',
  requirePermission('roles:delete'),
  rolesController.deleteRole
);

/**
 * @swagger
 * /api/v1/roles/{id}/permissions:
 *   post:
 *     tags: ["01 - Roles"]
 *     summary: Assign a permission to a role
 *     description: Add a specific permission mapping to a role.
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
 *             required: [permissionId]
 *             properties:
 *               permissionId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Permission assigned successfully
 *       404:
 *         description: Role or Permission not found
 *       409:
 *         description: Permission is already assigned
 */
router.post(
  '/:id/permissions',
  requirePermission('roles:write'),
  validate(assignPermissionSchema),
  rolesController.assignPermission
);

/**
 * @swagger
 * /api/v1/roles/{id}/permissions/{permissionId}:
 *   delete:
 *     tags: ["01 - Roles"]
 *     summary: Remove a permission from a role
 *     description: Delete a specific permission mapping from a role.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: permissionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Permission removed successfully
 *       404:
 *         description: Permission is not assigned to this role
 */
router.delete(
  '/:id/permissions/:permissionId',
  requirePermission('roles:write'),
  rolesController.removePermission
);

export default router;
