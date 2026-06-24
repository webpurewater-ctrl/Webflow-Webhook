const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

function readEnv(name, fallback = "") {
  const value = process.env[name];
  if (!value || !value.trim()) {
    return fallback;
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
  webhookProcessingTimeoutMs: optionalInt("WEBHOOK_PROCESSING_TIMEOUT_MS", 8000),
  clickship: {
    baseUrl: readEnv("CLICKSHIP_BASE_URL"),
    apiKey: readEnv("CLICKSHIP_API_KEY"),
    settlementPath: readEnv("CLICKSHIP_SETTLEMENT_PATH", "/v1/settlements/orders"),
    timeoutMs: optionalInt("CLICKSHIP_TIMEOUT_MS", 7000)
  }
};

module.exports = config;
