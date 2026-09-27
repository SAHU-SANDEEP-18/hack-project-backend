/**
 * Builds the system + user prompt for structured extraction.
 * We pass the current catalog items (with names and aliases) so the AI
 * grounds its output in real services and maps user slang/short words.
 */
export const buildExtractionPrompt = (customerMessage, catalogItems = []) => {
  const catalogSummary = catalogItems.map((c) => ({
    name: typeof c === 'string' ? c : c.name,
    aliases: typeof c === 'object' && Array.isArray(c.aliases) ? c.aliases : [],
  }));

  const system = `You are a strict invoice data extraction engine.
Read the customer's message (English, Hindi, or Hinglish) and return ONLY valid JSON — no markdown, no backticks, no explanation.

Known service catalog (with names and aliases): ${JSON.stringify(catalogSummary)}

Return exactly this JSON schema:
{
  "customer": {
    "name": string or null,
    "email": string or null,
    "phone": string or null
  },
  "items": [
    {
      "requested_text": string,       // the phrase customer used for this service
      "matched_service": string or null, // MUST be an exact catalog 'name' string from the catalog, else null
      "quantity": number              // default 1 if not mentioned
    }
  ],
  "notes": string or null
}

Rules (do not break these):
1. matched_service must be an EXACT catalog 'name' from the provided catalog list, or null if unsure. Use the provided aliases to map customer words (e.g. 'logo' maps to 'Logo Design', 'seo' maps to 'SEO Optimization').
2. Never invent or guess an email, phone, or name if it is not clearly present in the message.
3. Never invent prices — you are not given any prices and must not include any in your output.
4. If the message mentions multiple services, create a separate item for each.
5. Output must be valid, parseable JSON and nothing else.`;

  const user = `Customer message:\n"""${customerMessage}"""`;

  return { system, user };
};
