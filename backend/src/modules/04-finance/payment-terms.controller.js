import paymentTermsService from './payment-terms.service.js';

export const createPaymentTerm = async (req, res, next) => {
  try {
    const createdById = req.user?.id;
    const paymentTerm = await paymentTermsService.createPaymentTerm(req.body, createdById);
    res.status(201).json({ success: true, data: paymentTerm });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAllPaymentTerms = async (req, res, next) => {
  try {
    const terms = await paymentTermsService.getAllPaymentTerms();
    res.json({ success: true, data: terms });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPaymentTermById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const term = await paymentTermsService.getPaymentTermById(id);
    res.json({ success: true, data: term });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};
