import { mistralClient, groqClient, AI_MODELS } from "../config/ai.config.js";
import { AI_PROVIDER } from "../constants/status.constants.js";
import logger from "../utils/logger.js";
import ApiError from "../utils/ApiError.js";

/**
 * Both Mistral and Groq expose OpenAI-style /chat/completions endpoints,
 * so a single request builder works for either provider.
 */
const buildChatPayload = (model, systemPrompt, userPrompt) => ({
  model,
  temperature: 0,
  response_format: { type: "json_object" },
  messages: [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ],
});

const callMistral = async (systemPrompt, userPrompt) => {
  const payload = buildChatPayload(AI_MODELS.mistral, systemPrompt, userPrompt);
  const { data } = await mistralClient.post("/chat/completions", payload);
  return data?.choices?.[0]?.message?.content;
};

const callGroq = async (systemPrompt, userPrompt) => {
  const payload = buildChatPayload(AI_MODELS.groq, systemPrompt, userPrompt);
  const { data } = await groqClient.post("/chat/completions", payload);
  return data?.choices?.[0]?.message?.content;
};

/**
 * Tries Mistral first. On any failure (timeout, 4xx/5xx, network),
 * automatically falls back to Groq. Throws only if both fail.
 * @returns {{ rawText: string, provider: "mistral"|"groq" }}
 */
export const getChatCompletion = async (systemPrompt, userPrompt) => {
  try {
    const rawText = await callMistral(systemPrompt, userPrompt);
    if (!rawText) throw new Error("Empty response from Mistral");
    return { rawText, provider: AI_PROVIDER.MISTRAL };
  } catch (mistralErr) {
    logger.warn(`Mistral call failed (${mistralErr.message}). Falling back to Groq...`);
    try {
      const rawText = await callGroq(systemPrompt, userPrompt);
      if (!rawText) throw new Error("Empty response from Groq");
      return { rawText, provider: AI_PROVIDER.GROQ };
    } catch (groqErr) {
      logger.error(`Groq fallback also failed: ${groqErr.message}`);
      throw new ApiError(502, "Both AI providers (Mistral and Groq) failed to respond");
    }
  }
};
