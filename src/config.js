const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

function requireEnv(name) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

function optionalInt(name, fallback) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid integer for ${name}: ${value}`);
  }
  return parsed;
}

const config = {
  port: optionalInt("PORT", 3000),
  webflowWebhookSecret: process.env.WEBFLOW_WEBHOOK_SECRET || "",
  clickship: {
    baseUrl: requireEnv("CLICKSHIP_BASE_URL"),
    apiKey: requireEnv("CLICKSHIP_API_KEY"),
    settlementPath: process.env.CLICKSHIP_SETTLEMENT_PATH || "/v1/settlements/orders",
    timeoutMs: optionalInt("CLICKSHIP_TIMEOUT_MS", 15000)
  }
};

module.exports = config;
