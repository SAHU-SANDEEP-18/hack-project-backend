import serviceDao from "../dao/service.dao.js";
import { fetchPricingRows } from "../repositories/pricingSheet.repository.js";
import { fuzzyMatchService } from "../utils/fuzzyMatch.js";
import { ITEM_MATCH_STATUS } from "../constants/status.constants.js";
import env from "../config/env.config.js";
import logger from "../utils/logger.js";

let lastSyncedAt = 0;
let cachedCatalog = [];

export const invalidateCache = () => {
  lastSyncedAt = 0;
  cachedCatalog = [];
};

/**
 * Syncs the local catalog cache from Google Sheet (or local CSV fallback)
 * if the cache is stale. Cheap to call often — respects TTL internally.
 */
export const syncCatalog = async ({ force = false } = {}) => {
  const isStale = Date.now() - lastSyncedAt > env.pricing.cacheTtlMs;

  if (!force && !isStale && cachedCatalog.length > 0) {
    return { catalog: cachedCatalog, refreshed: false };
  }

  const { rows, source } = await fetchPricingRows();

  if (rows.length > 0) {
    await serviceDao.bulkReplace(rows);
    logger.info(`Catalog synced from ${source}: ${rows.length} services`);
  } else {
    logger.warn("Pricing sync returned 0 rows, keeping previous catalog");
  }

  cachedCatalog = await serviceDao.findAll();
  lastSyncedAt = Date.now();

  return { catalog: cachedCatalog, refreshed: true, source };
};

export const getCatalogNames = async () => {
  const { catalog } = await syncCatalog();
  return catalog.map((c) => c.name);
};

export const getCatalogItems = async () => {
  const { catalog } = await syncCatalog();
  return catalog;
};

/**
 * Given AI-extracted items, resolves each one against the price catalog.
 * NEVER invents a price — unmatched items get unitPricePaise: null
 * and matchStatus: "not_found" so the frontend can flag them for review.
 */
export const resolveItemPrices = async (extractedItems) => {
  const { catalog } = await syncCatalog();

  return extractedItems.map((item) => {
    const requestedText = item.requested_text;
    const quantity = Number(item.quantity) > 0 ? Number(item.quantity) : 1;

    // 1. Trust AI's matched_service ONLY if it's an exact catalog name
    if (item.matched_service) {
      const exact = catalog.find(
        (c) => c.name.toLowerCase() === item.matched_service.toLowerCase()
      );
      if (exact) {
        return buildResolvedItem(requestedText, quantity, exact, ITEM_MATCH_STATUS.MATCHED);
      }
    }

    // 2. Fall back to fuzzy matching on our own catalog
    const { status, match, candidates } = fuzzyMatchService(requestedText, catalog);

    if (status === ITEM_MATCH_STATUS.MATCHED) {
      return buildResolvedItem(requestedText, quantity, match, ITEM_MATCH_STATUS.MATCHED);
    }

    if (status === ITEM_MATCH_STATUS.AMBIGUOUS) {
      return {
        requestedText,
        matchedService: null,
        quantity,
        unitPricePaise: null,
        lineTotalPaise: 0,
        matchStatus: ITEM_MATCH_STATUS.AMBIGUOUS,
        candidates: candidates.map((c) => c.name),
      };
    }

    // 3. Genuinely not found — flag for review, no fabricated price
    return {
      requestedText,
      matchedService: null,
      quantity,
      unitPricePaise: null,
      lineTotalPaise: 0,
      matchStatus: ITEM_MATCH_STATUS.NOT_FOUND,
      candidates: [],
    };
  });
};

const buildResolvedItem = (requestedText, quantity, catalogItem, status) => ({
  requestedText,
  matchedService: catalogItem.name,
  quantity,
  unitPricePaise: catalogItem.unitPricePaise,
  lineTotalPaise: catalogItem.unitPricePaise * quantity,
  matchStatus: status,
  candidates: [],
});
