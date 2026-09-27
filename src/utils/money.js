// All calculations happen in paise (integer) to avoid floating point errors,
// then converted back to rupees only for display.

export const toPaise = (rupees) => Math.round(Number(rupees) * 100);

export const toRupees = (paise) => Math.round(paise) / 100;

export const lineTotalPaise = (unitPricePaise, quantity) =>
  Math.round(unitPricePaise * Number(quantity));

export const sumPaise = (paiseArray) =>
  paiseArray.reduce((acc, val) => acc + (Number.isFinite(val) ? val : 0), 0);

export const applyTaxPaise = (subtotalPaise, taxRatePercent) =>
  Math.round((subtotalPaise * Number(taxRatePercent)) / 100);

export const formatCurrency = (paise, currency = "INR") => {
  const rupees = toRupees(paise);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(rupees);
};
