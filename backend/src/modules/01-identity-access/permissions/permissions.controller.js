import * as permissionsService from './permissions.service.js';

export const getPermissions = async (req, res, next) => {
  try {
    const permissions = await permissionsService.getAllPermissions();
    res.json({ success: true, data: permissions });
  } catch (error) {
    next(error);
  }
};

export const getPermission = async (req, res, next) => {
  try {
    const permission = await permissionsService.getPermissionById(req.params.id);
    res.json({ success: true, data: permission });
  } catch (error) {
    if (error.message === 'Permission not found') {
      return res.status(404).json({ success: false, error: error.message });
    }
    next(error);
  }
};

export const createPermission = async (req, res, next) => {
  try {
    const permission = await permissionsService.createPermission(req.body, req.user?.id);
    res.status(201).json({ success: true, data: permission });
  } catch (error) {
    if (error.message === 'Permission with this name already exists') {
      return res.status(409).json({ success: false, error: error.message });
    }
    next(error);
  }
};

export const updatePermission = async (req, res, next) => {
  try {
    const permission = await permissionsService.updatePermission(req.params.id, req.body, req.user?.id);
    res.json({ success: true, data: permission });
  } catch (error) {
    if (error.message === 'Permission not found') {
      return res.status(404).json({ success: false, error: error.message });
    }
    if (error.message === 'Permission with this name already exists') {
      return res.status(409).json({ success: false, error: error.message });
    }
    next(error);
  }
};

export const deletePermission = async (req, res, next) => {
  try {
    await permissionsService.deletePermission(req.params.id, req.user?.id);
    res.json({ success: true, message: 'Permission deleted successfully' });
  } catch (error) {
    if (error.message === 'Permission not found') {
      return res.status(404).json({ success: false, error: error.message });
    }
    next(error);
  }
};
