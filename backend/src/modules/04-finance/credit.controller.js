import creditService from './credit.service.js';

export const createManualCredit = async (req, res, next) => {
  try {
    const createdById = req.user?.id;
    const credit = await creditService.createManualCredit(req.body, createdById);
    res.status(201).json({ success: true, data: credit });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const createCreditFromReturn = async (req, res, next) => {
  try {
    const createdById = req.user?.id;
    const credit = await creditService.createCreditFromReturn(req.body, createdById);
    res.status(201).json({ success: true, data: credit });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getCustomerCredits = async (req, res, next) => {
  try {
    const { customerId } = req.params;
    const result = await creditService.getCustomerCredits(customerId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAllCredits = async (req, res, next) => {
  try {
    const credits = await creditService.getAllCredits(req.query);
    res.json({ success: true, data: credits });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const applyCreditToInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { invoiceId, amount } = req.body;
    const updatedById = req.user?.id;

    const result = await creditService.applyCreditToInvoice(id, invoiceId, amount, updatedById);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getCreditHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const history = await creditService.getCreditHistory(id);
    res.json({ success: true, data: history });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

export const getCustomerCreditSummary = async (req, res, next) => {
  try {
    const { customerId } = req.params;
    const summary = await creditService.getCustomerCreditSummary(customerId);
    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const validateCreditLimit = async (req, res, next) => {
  try {
    const { customerId } = req.params;
    const { amount } = req.body;
    const result = await creditService.validateCreditLimit(customerId, Number(amount));
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
