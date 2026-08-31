import * as rolesService from './roles.service.js';

export const getRoles = async (req, res, next) => {
  try {
    const roles = await rolesService.getAllRoles();
    res.json({ success: true, data: roles });
  } catch (error) {
    next(error);
  }
};

export const getRole = async (req, res, next) => {
  try {
    const role = await rolesService.getRoleById(req.params.id);
    res.json({ success: true, data: role });
  } catch (error) {
    if (error.message === 'Role not found') {
      return res.status(404).json({ success: false, error: error.message });
    }
    next(error);
  }
};

export const createRole = async (req, res, next) => {
  try {
    const role = await rolesService.createRole(req.body, req.user?.id);
    res.status(201).json({ success: true, data: role });
  } catch (error) {
    if (error.message === 'Role with this name already exists') {
      return res.status(409).json({ success: false, error: error.message });
    }
    next(error);
  }
};

export const updateRole = async (req, res, next) => {
  try {
    const role = await rolesService.updateRole(req.params.id, req.body, req.user?.id);
    res.json({ success: true, data: role });
  } catch (error) {
    if (error.message === 'Role not found') {
      return res.status(404).json({ success: false, error: error.message });
    }
    if (error.message === 'Role with this name already exists') {
      return res.status(409).json({ success: false, error: error.message });
    }
    next(error);
  }
};

export const deleteRole = async (req, res, next) => {
  try {
    await rolesService.deleteRole(req.params.id, req.user?.id);
    res.json({ success: true, message: 'Role deleted successfully' });
  } catch (error) {
    if (error.message === 'Role not found') {
      return res.status(404).json({ success: false, error: error.message });
    }
    next(error);
  }
};

export const assignPermission = async (req, res, next) => {
  try {
    await rolesService.assignPermission(req.params.id, req.body.permissionId, req.user?.id);
    res.json({ success: true, message: 'Permission assigned successfully' });
  } catch (error) {
    if (error.message === 'Role not found' || error.message === 'Permission not found') {
      return res.status(404).json({ success: false, error: error.message });
    }
    if (error.message === 'Permission is already assigned to this role') {
      return res.status(409).json({ success: false, error: error.message });
    }
    next(error);
  }
};

export const removePermission = async (req, res, next) => {
  try {
    await rolesService.removePermission(req.params.id, req.params.permissionId, req.user?.id);
    res.json({ success: true, message: 'Permission removed successfully' });
  } catch (error) {
    if (error.message === 'Permission is not assigned to this role') {
      return res.status(404).json({ success: false, error: error.message });
    }
    next(error);
  }
};
