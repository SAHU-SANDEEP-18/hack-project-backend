import asyncHandler from "../middlewares/asyncHandler.middleware.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import serviceDao from "../dao/service.dao.js";
import { syncCatalog, invalidateCache } from "../services/pricing.service.js";
import { toPaise, toRupees } from "../utils/money.js";

// Lets the frontend / demo force a re-sync from Google Sheet or fallback CSV
export const syncPricing = asyncHandler(async (req, res) => {
  const result = await syncCatalog({ force: true });
  const catalogWithPrice = (result.catalog || []).map((s) => ({
    ...(s.toObject ? s.toObject() : s),
    price: toRupees(s.unitPricePaise),
  }));
  res.json(new ApiResponse(200, { ...result, catalog: catalogWithPrice }, "Pricing catalog synced"));
});

export const getCatalog = asyncHandler(async (req, res) => {
  const services = await serviceDao.findAll();
  const catalog = services.map((s) => ({
    ...(s.toObject ? s.toObject() : s),
    price: toRupees(s.unitPricePaise),
  }));
  res.json(new ApiResponse(200, catalog));
});

export const createService = asyncHandler(async (req, res) => {
  const { name, price, unit, category, aliases } = req.body;
  const existing = await serviceDao.findByName(name);
  if (existing) {
    throw new ApiError(400, `Service with name "${name}" already exists`);
  }
  const unitPricePaise = toPaise(price);
  const service = await serviceDao.create({
    name,
    unitPricePaise,
    unit: unit || "each",
    category: category || null,
    aliases: aliases || [],
  });
  invalidateCache();
  res.status(201).json(
    new ApiResponse(
      201,
      {
        ...service.toObject(),
        price: toRupees(service.unitPricePaise),
      },
      "Service created successfully"
    )
  );
});

export const updateService = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, price, unit, category, aliases } = req.body;
  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (price !== undefined) updateData.unitPricePaise = toPaise(price);
  if (unit !== undefined) updateData.unit = unit;
  if (category !== undefined) updateData.category = category;
  if (aliases !== undefined) updateData.aliases = aliases;

  const service = await serviceDao.updateById(id, updateData);
  if (!service) {
    throw new ApiError(404, "Service not found");
  }
  invalidateCache();
  res.json(
    new ApiResponse(
      200,
      {
        ...service.toObject(),
        price: toRupees(service.unitPricePaise),
      },
      "Service updated successfully"
    )
  );
});

export const deleteService = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const service = await serviceDao.deleteById(id);
  if (!service) {
    throw new ApiError(404, "Service not found");
  }
  invalidateCache();
  res.json(new ApiResponse(200, null, "Service deleted successfully"));
});
