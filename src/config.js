function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const webhookProcessingTimeoutMs = toNumber(process.env.WEBHOOK_PROCESSING_TIMEOUT_MS, 15000);

module.exports = {
  port: toNumber(process.env.PORT, 3000),
  webhookProcessingTimeoutMs,
  webflowWebhookSecret: process.env.WEBFLOW_WEBHOOK_SECRET || "",
  clickship: {
    baseUrl: process.env.CLICKSHIP_BASE_URL || "",
    apiKey: process.env.CLICKSHIP_API_KEY || "",
    timeoutMs: toNumber(process.env.CLICKSHIP_TIMEOUT_MS, webhookProcessingTimeoutMs),
  },
};