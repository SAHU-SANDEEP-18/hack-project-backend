export const INVOICE_STATUS = Object.freeze({
  DRAFT: "DRAFT",               // just generated, not yet checked
  NEEDS_REVIEW: "NEEDS_REVIEW", // has unmatched items / missing customer info
  APPROVED: "APPROVED",         // user confirmed, ready to export
  EXPORTED: "EXPORTED",         // PDF generated / downloaded
});

export const ITEM_MATCH_STATUS = Object.freeze({
  MATCHED: "matched",
  AMBIGUOUS: "ambiguous",
  NOT_FOUND: "not_found",
});

export const AI_PROVIDER = Object.freeze({
  MISTRAL: "mistral",
  GROQ: "groq",
});
