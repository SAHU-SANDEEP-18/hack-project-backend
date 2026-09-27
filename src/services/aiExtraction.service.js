import { buildExtractionPrompt } from "../prompts/extraction.prompt.js";
import { getChatCompletion } from "./aiProvider.service.js";
import logger from "../utils/logger.js";
import env from "../config/env.config.js";

/**
 * Strips accidental markdown fences and parses JSON safely.
 */
const safeParseJson = (text) => {
  const cleaned = text
    .trim()
    .replace(/^```json/i, "")
    .replace(/^```/, "")
    .replace(/```$/, "")
    .trim();
  return JSON.parse(cleaned);
};

/**
 * Minimal shape validation — ensures the AI followed the schema
 * before this data flows into pricing/invoice logic.
 */
const isValidExtraction = (json) => {
  if (!json || typeof json !== "object") return false;
  if (!json.customer || typeof json.customer !== "object") return false;
  if (!Array.isArray(json.items)) return false;
  for (const item of json.items) {
    if (typeof item.requested_text !== "string") return false;
  }
  return true;
};

/**
 * Rule-based fallback extractor matching both catalog names AND aliases.
 */
export const ruleBasedExtractor = (customerMessage, catalogItems = []) => {
  // 1. Email regex
  const emailMatch = customerMessage.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch ? emailMatch[0] : null;

  // 2. Phone regex
  const phoneMatch = customerMessage.match(/(?:\+91[-.\s]?)?[6-9]\d{9}/);
  const phone = phoneMatch ? phoneMatch[0] : null;

  // 3. Name regex
  let name = null;
  const nameMatch = customerMessage.match(/(?:invoice|bill|for)\s+([A-Z][a-zA-B0-9\s]+?)(?=\s*\(|\s*for|\s*email|\s*with|\s*phone|\s*ordered|\s*for|\s*\.|\s*,|$)/i);
  if (nameMatch && nameMatch[1]) {
    name = nameMatch[1].trim();
  } else {
    const wordsBeforeEmail = customerMessage.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*(?=\(?[a-zA-Z0-9._%+-]+@)/);
    if (wordsBeforeEmail) {
      name = wordsBeforeEmail[1].trim();
    }
  }

  // 4. Items extraction matching names AND aliases!
  const items = [];
  const lowercaseMsg = customerMessage.toLowerCase();

  for (const catItem of catalogItems) {
    const catName = typeof catItem === "string" ? catItem : catItem.name;
    const aliases = typeof catItem === "object" && Array.isArray(catItem.aliases) ? catItem.aliases : [];
    const keywords = [catName, ...aliases];

    let matchedKeyword = null;
    for (const kw of keywords) {
      if (kw && kw.trim().length >= 2) {
        // Match whole word or exact substring
        const kwLower = kw.toLowerCase();
        if (lowercaseMsg.includes(kwLower)) {
          matchedKeyword = kw;
          break;
        }
      }
    }

    if (matchedKeyword) {
      const kwLower = matchedKeyword.toLowerCase();
      const qtyRegex = new RegExp(`(\\d+)\\s*(?:x|units?|items?|hours?)?\\s*${kwLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
      const qtyMatch = customerMessage.match(qtyRegex);
      const quantity = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;

      items.push({
        requested_text: matchedKeyword,
        matched_service: catName,
        quantity: quantity > 0 ? quantity : 1,
      });
    }
  }

  // Generic phrase parsing if no catalog keywords matched
  if (items.length === 0) {
    const genericMatches = [...customerMessage.matchAll(/(\d+)\s+([a-zA-Z0-9\s]{3,30})(?:,|and|\.|$)/g)];
    for (const match of genericMatches) {
      const qty = parseInt(match[1], 10);
      const text = match[2].trim();
      if (text && !text.toLowerCase().includes('invoice') && !text.toLowerCase().includes('customer')) {
        items.push({
          requested_text: text,
          matched_service: null,
          quantity: qty > 0 ? qty : 1,
        });
      }
    }
  }

  // Fallback line item if none matched
  if (items.length === 0) {
    items.push({
      requested_text: customerMessage.substring(0, 50).trim(),
      matched_service: null,
      quantity: 1,
    });
  }

  return {
    customer: {
      name: name || null,
      email: email || null,
      phone: phone || null,
    },
    items,
    notes: "Extracted via smart pattern extractor",
  };
};

/**
 * Extracts structured invoice data from a raw customer message.
 */
export const extractInvoiceData = async (customerMessage, catalogItems = []) => {
  if (env.ai.mockAi) {
    logger.info("MOCK_AI=true: Using rule-based mock extractor");
    return {
      extracted: ruleBasedExtractor(customerMessage, catalogItems),
      provider: "mock",
    };
  }

  const { system, user } = buildExtractionPrompt(customerMessage, catalogItems);
  let lastError;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const { rawText, provider } = await getChatCompletion(system, user);
      const parsed = safeParseJson(rawText);

      if (!isValidExtraction(parsed)) {
        throw new Error("AI response failed schema validation");
      }

      return { extracted: parsed, provider };
    } catch (err) {
      lastError = err;
      logger.warn(`Extraction attempt ${attempt} failed: ${err.message}`);
    }
  }

  logger.warn(`AI extraction failed (${lastError?.message}). Falling back to pattern extractor.`);
  return {
    extracted: ruleBasedExtractor(customerMessage, catalogItems),
    provider: "rule-fallback",
  };
};
