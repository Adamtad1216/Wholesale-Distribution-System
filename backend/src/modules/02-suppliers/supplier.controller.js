import supplierService from './supplier.service.js';

export const createSupplier = async (req, res, next) => {
  try {
    const createdById = req.user?.id;
    const supplier = await supplierService.createSupplier(req.body, createdById);
    res.status(201).json({
      success: true,
      data: supplier,
      message: 'Supplier created successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getSuppliers = async (req, res, next) => {
  try {
    const { skip, take, status, isArchived } = req.query;
    const filters = {};
    if (status) filters.status = status;
    if (isArchived !== undefined) {
      filters.isArchived = isArchived === 'true';
    } else {
      filters.isArchived = false;
    }

    const result = await supplierService.getSuppliers(filters, { skip, take });
    res.status(200).json({
      success: true,
      data: result.suppliers,
      meta: {
        total: result.total,
        skip: result.skip,
        take: result.take
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getSupplierById = async (req, res, next) => {
  try {
    const supplier = await supplierService.getSupplierById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }
    res.status(200).json({ success: true, data: supplier });
  } catch (error) {
    next(error);
  }
};

export const updateSupplier = async (req, res, next) => {
  try {
    const updatedById = req.user?.id;
    const supplier = await supplierService.updateSupplier(req.params.id, req.body, updatedById);
    res.status(200).json({
      success: true,
      data: supplier,
      message: 'Supplier updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const archiveSupplier = async (req, res, next) => {
  try {
    const updatedById = req.user?.id;
    const supplier = await supplierService.archiveSupplier(req.params.id, updatedById);
    res.status(200).json({
      success: true,
      data: supplier,
      message: 'Supplier archived successfully'
    });
  } catch (error) {
    next(error);
  }
};
