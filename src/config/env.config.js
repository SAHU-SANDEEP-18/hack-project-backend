import dotenv from "dotenv";
dotenv.config();

const required = (key, fallback = undefined) => {
  const value = process.env[key] ?? fallback;
  return value;
};

const env = {
  port: Number(required("PORT", 5000)),
  nodeEnv: required("NODE_ENV", "development"),

  mongoUri: required("MONGO_URI"),

  ai: {
    mockAi: process.env.MOCK_AI === "true",
    mistral: {
      apiKey: required("MISTRAL_API_KEY"),
      model: required("MISTRAL_MODEL", "mistral-small-latest"),
      baseUrl: required("MISTRAL_BASE_URL", "https://api.mistral.ai/v1"),
    },
    groq: {
      apiKey: required("GROQ_API_KEY"),
      model: required("GROQ_MODEL", "llama-3.3-70b-versatile"),
      baseUrl: required("GROQ_BASE_URL", "https://api.groq.com/openai/v1"),
    },
    timeoutMs: Number(required("AI_TIMEOUT_MS", 8000)),
  },

  pricing: {
    sheetCsvUrl: required("PRICING_SHEET_CSV_URL", ""),
    cacheTtlMs: Number(required("PRICING_CACHE_TTL_MS", 300000)),
  },

  tax: {
    defaultRate: Number(required("DEFAULT_TAX_RATE", 18)),
  },

  clientOrigin: required("CLIENT_ORIGIN", "http://localhost:5173"),
};

export default env;
