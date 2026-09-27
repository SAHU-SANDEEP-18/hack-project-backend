import axios from "axios";
import env from "./env.config.js";

// Both Mistral and Groq expose OpenAI-compatible chat completion endpoints,
// so we can use one thin axios client per provider with the same shape.

export const mistralClient = axios.create({
  baseURL: env.ai.mistral.baseUrl,
  timeout: env.ai.timeoutMs,
  headers: {
    Authorization: `Bearer ${env.ai.mistral.apiKey}`,
    "Content-Type": "application/json",
  },
});

export const groqClient = axios.create({
  baseURL: env.ai.groq.baseUrl,
  timeout: env.ai.timeoutMs,
  headers: {
    Authorization: `Bearer ${env.ai.groq.apiKey}`,
    "Content-Type": "application/json",
  },
});

export const AI_MODELS = {
  mistral: env.ai.mistral.model,
  groq: env.ai.groq.model,
};
