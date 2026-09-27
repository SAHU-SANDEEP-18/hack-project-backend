import invoiceDao from "../dao/invoice.dao.js";
import customerDao from "../dao/customer.dao.js";
import { extractInvoiceData } from "./aiExtraction.service.js";
import { getCatalogItems, resolveItemPrices } from "./pricing.service.js";
import { generateInvoiceNumber } from "../utils/invoiceNumber.js";
import { sumPaise, applyTaxPaise } from "../utils/money.js";
import { INVOICE_STATUS, ITEM_MATCH_STATUS } from "../constants/status.constants.js";
import env from "../config/env.config.js";
import ApiError from "../utils/ApiError.js";

/**
 * Recomputes subtotal/tax/total and warnings from the current items array.
 * Called on generation AND every time items are edited during review.
 */
const recomputeTotals = (items, taxRatePercent) => {
  const itemsWithTotals = items.map((it) => ({
    ...it,
    lineTotalPaise:
      it.unitPricePaise != null ? it.unitPricePaise * it.quantity : 0,
  }));

  const subtotalPaise = sumPaise(itemsWithTotals.map((i) => i.lineTotalPaise));
  const taxAmountPaise = applyTaxPaise(subtotalPaise, taxRatePercent);
  const totalPaise = subtotalPaise + taxAmountPaise;

  return { itemsWithTotals, subtotalPaise, taxAmountPaise, totalPaise };
};

const buildWarnings = (customer, items) => {
  const warnings = [];
  if (!customer?.name) warnings.push("Customer name is missing — please add it.");
  if (!customer?.email) warnings.push("Customer email is missing — please add it.");

  const unresolved = items.filter((i) => i.matchStatus !== ITEM_MATCH_STATUS.MATCHED);
  if (unresolved.length > 0) {
    warnings.push(
      `${unresolved.length} item(s) need review — price not found or ambiguous match.`
    );
  }
  return warnings;
};

const deriveStatus = (warnings) =>
  warnings.length > 0 ? INVOICE_STATUS.NEEDS_REVIEW : INVOICE_STATUS.DRAFT;

/**
 * Full pipeline: raw message -> AI extraction -> price resolution -> saved draft invoice.
 */
export const generateInvoiceFromMessage = async (rawMessage) => {
  if (!rawMessage || rawMessage.trim().length < 5) {
    throw new ApiError(400, "Customer message is too short to process");
  }

  const catalogItems = await getCatalogItems();
  const { extracted, provider } = await extractInvoiceData(rawMessage, catalogItems);

  const resolvedItems = await resolveItemPrices(extracted.items || []);
  const { itemsWithTotals, subtotalPaise, taxAmountPaise, totalPaise } = recomputeTotals(
    resolvedItems,
    env.tax.defaultRate
  );

  const warnings = buildWarnings(extracted.customer, itemsWithTotals);
  const status = deriveStatus(warnings);

  const invoice = await invoiceDao.create({
    invoiceNumber: generateInvoiceNumber(),
    status,
    rawMessage,
    aiProviderUsed: provider,
    customer: {
      name: extracted.customer?.name || null,
      email: extracted.customer?.email || null,
      phone: extracted.customer?.phone || null,
    },
    items: itemsWithTotals,
    notes: extracted.notes || null,
    subtotalPaise,
    taxRatePercent: env.tax.defaultRate,
    taxAmountPaise,
    totalPaise,
    warnings,
  });

  return invoice;
};

/**
 * Applies user edits during the review step (customer info, item prices/qty,
 * added/removed items) and recomputes totals + warnings + status.
 */
export const updateInvoiceDraft = async (invoiceId, updates) => {
  const invoice = await invoiceDao.findById(invoiceId);
  if (!invoice) throw new ApiError(404, "Invoice not found");
  if (invoice.status === INVOICE_STATUS.APPROVED || invoice.status === INVOICE_STATUS.EXPORTED) {
    throw new ApiError(409, "Cannot edit an already approved/exported invoice");
  }

  const mergedCustomer = { ...invoice.customer.toObject(), ...(updates.customer || {}) };
  const mergedItems = updates.items || invoice.items;
  const taxRatePercent = updates.taxRatePercent ?? invoice.taxRatePercent;

  const { itemsWithTotals, subtotalPaise, taxAmountPaise, totalPaise } = recomputeTotals(
    mergedItems,
    taxRatePercent
  );

  const warnings = buildWarnings(mergedCustomer, itemsWithTotals);
  const status = deriveStatus(warnings);

  return invoiceDao.updateById(invoiceId, {
    customer: mergedCustomer,
    items: itemsWithTotals,
    notes: updates.notes ?? invoice.notes,
    taxRatePercent,
    subtotalPaise,
    taxAmountPaise,
    totalPaise,
    warnings,
    status,
  });
};

/**
 * Approves an invoice — only allowed once ALL items are matched and
 * required customer fields are present. This is the "human in the loop" gate.
 */
export const approveInvoice = async (invoiceId) => {
  const invoice = await invoiceDao.findById(invoiceId);
  if (!invoice) throw new ApiError(404, "Invoice not found");

  const stillUnresolved = invoice.items.some(
    (i) => i.matchStatus !== ITEM_MATCH_STATUS.MATCHED || i.unitPricePaise == null
  );
  if (stillUnresolved) {
    throw new ApiError(400, "Cannot approve: some items still need price review");
  }
  if (!invoice.customer?.name || !invoice.customer?.email) {
    throw new ApiError(400, "Cannot approve: customer name and email are required");
  }

  return invoiceDao.updateById(invoiceId, {
    status: INVOICE_STATUS.APPROVED,
    approvedAt: new Date(),
  });
};

export const markExported = async (invoiceId) => {
  return invoiceDao.updateById(invoiceId, {
    status: INVOICE_STATUS.EXPORTED,
    exportedAt: new Date(),
  });
};

export const getInvoiceById = async (invoiceId) => {
  const invoice = await invoiceDao.findById(invoiceId);
  if (!invoice) throw new ApiError(404, "Invoice not found");
  return invoice;
};

export const listInvoices = (query) => invoiceDao.list(query);
