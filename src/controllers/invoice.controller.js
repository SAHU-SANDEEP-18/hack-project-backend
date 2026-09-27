import asyncHandler from "../middlewares/asyncHandler.middleware.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import {
  generateInvoiceFromMessage,
  updateInvoiceDraft,
  approveInvoice,
  markExported,
  getInvoiceById,
  listInvoices,
} from "../services/invoice.service.js";
import { generateInvoicePdf } from "../services/pdf.service.js";
import { INVOICE_STATUS } from "../constants/status.constants.js";

export const generateInvoice = asyncHandler(async (req, res) => {
  const { message } = req.body;
  const invoice = await generateInvoiceFromMessage(message);
  res.status(201).json(new ApiResponse(201, invoice, "Invoice draft generated"));
});

export const getInvoice = asyncHandler(async (req, res) => {
  const invoice = await getInvoiceById(req.params.id);
  res.json(new ApiResponse(200, invoice));
});

export const updateInvoice = asyncHandler(async (req, res) => {
  const invoice = await updateInvoiceDraft(req.params.id, req.body);
  res.json(new ApiResponse(200, invoice, "Invoice updated"));
});

export const approveInvoiceHandler = asyncHandler(async (req, res) => {
  const invoice = await approveInvoice(req.params.id);
  res.json(new ApiResponse(200, invoice, "Invoice approved"));
});

export const downloadInvoicePdf = asyncHandler(async (req, res) => {
  const invoice = await getInvoiceById(req.params.id);

  if (invoice.status !== INVOICE_STATUS.APPROVED && invoice.status !== INVOICE_STATUS.EXPORTED) {
    throw new ApiError(400, "Invoice must be approved before it can be exported");
  }

  const pdfBuffer = await generateInvoicePdf(invoice);
  await markExported(invoice._id);

  res.set({
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="${invoice.invoiceNumber}.pdf"`,
  });
  res.send(pdfBuffer);
});

export const listInvoicesHandler = asyncHandler(async (req, res) => {
  const { status, page, limit } = req.query;
  const invoices = await listInvoices({ status, page: Number(page) || 1, limit: Number(limit) || 20 });
  res.json(new ApiResponse(200, invoices));
});
