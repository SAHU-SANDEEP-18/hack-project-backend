import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import env from "../config/env.config.js";
import logger from "../utils/logger.js";
import { toPaise } from "../utils/money.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FALLBACK_CSV_PATH = path.join(__dirname, "../../data/services.fallback.csv");

/**
 * Parses raw CSV text into normalized service rows.
 * Expected columns: name,price,unit,category,aliases
 * aliases column is optional, pipe-separated e.g. "logo|logo design|brand logo"
 */
const parseCsv = (csvText) => {
  const lines = csvText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim());
    const record = {};
    headers.forEach((h, idx) => (record[h] = cols[idx]));

    if (!record.name || !record.price) continue;

    rows.push({
      name: record.name,
      unitPricePaise: toPaise(record.price),
      unit: record.unit || "each",
      category: record.category || null,
      aliases: record.aliases ? record.aliases.split("|").map((a) => a.trim()) : [],
      sourceRow: i + 1,
    });
  }

  return rows;
};

const fetchFromGoogleSheet = async () => {
  if (!env.pricing.sheetCsvUrl) {
    throw new Error("PRICING_SHEET_CSV_URL not configured");
  }
  const { data } = await axios.get(env.pricing.sheetCsvUrl, { timeout: 6000 });
  return parseCsv(data);
};

const fetchFromLocalCsv = () => {
  if (!fs.existsSync(FALLBACK_CSV_PATH)) {
    logger.error("Fallback CSV not found at " + FALLBACK_CSV_PATH);
    return [];
  }
  const csvText = fs.readFileSync(FALLBACK_CSV_PATH, "utf-8");
  return parseCsv(csvText);
};

/**
 * Tries Google Sheet first, falls back to local CSV on any failure.
 * Returns { rows, source: "google_sheet" | "local_csv" }
 */
export const fetchPricingRows = async () => {
  try {
    const rows = await fetchFromGoogleSheet();
    if (rows.length > 0) {
      logger.info(`Pricing synced from Google Sheet (${rows.length} services)`);
      return { rows, source: "google_sheet" };
    }
    throw new Error("Google Sheet returned 0 rows");
  } catch (err) {
    logger.warn(`Google Sheet fetch failed (${err.message}), using local CSV fallback`);
    const rows = fetchFromLocalCsv();
    return { rows, source: "local_csv" };
  }
};
