const express = require("express");
const morgan = require("morgan");

const config = require("./config");
const { isValidWebflowSignature } = require("./webflowSignature");
const { mapWebflowOrderToClickShipSettlement } = require("./orderMapper");
const { createClickShipClient } = require("./clickshipClient");

const app = express();

function withTimeout(promise, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      const timeoutError = new Error("Webhook processing exceeded allowed time window");
      timeoutError.code = "PROCESSING_TIMEOUT";
      reject(timeoutError);
    }, timeoutMs);

    promise
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

app.use(morgan("combined"));
app.use((req, res, next) => {
  req.setTimeout(config.webhookProcessingTimeoutMs);
  res.setTimeout(config.webhookProcessingTimeoutMs, () => {
    if (!res.headersSent) {
      res.status(504).json({
        error: "Request timed out",
        message: "The request exceeded the server processing limit"
      });
    }
  });
  next();
});
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    }
  })
);

app.get("/", (_req, res) => {
  res.json({
    status: "ok",
    service: "webflow-clickship-webhook",
    endpoint: "/health"
  });
});

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "webflow-clickship-webhook",
    timestamp: new Date().toISOString()
  });
});

app.post("/webhooks/webflow/orders", async (req, res) => {
  try {
    if (!config.clickship.baseUrl || !config.clickship.apiKey) {
      return res.status(500).json({
        error: "ClickShip is not configured",
        message: "Set CLICKSHIP_BASE_URL and CLICKSHIP_API_KEY in environment variables"
      });
    }

    const clickshipClient = createClickShipClient(config.clickship);

    const isValid = isValidWebflowSignature(
      req.rawBody || Buffer.from(JSON.stringify(req.body || {}), "utf8"),
      req.headers,
      config.webflowWebhookSecret
    );

    if (!isValid) {
      return res.status(401).json({ error: "Invalid webhook signature" });
    }

    const settlementPayload = mapWebflowOrderToClickShipSettlement(req.body);
    const clickshipResponse = await withTimeout(
      clickshipClient.submitSettlement(settlementPayload),
      config.webhookProcessingTimeoutMs
    );

    return res.status(200).json({
      status: "forwarded",
      externalOrderId: settlementPayload.externalOrderId,
      clickship: clickshipResponse
    });
  } catch (error) {
    const responseData = error.response?.data;
    const statusCode =
      error.code === "PROCESSING_TIMEOUT"
        ? 504
        : error.code === "ECONNABORTED"
          ? 504
          : error.response?.status || 500;

    console.error("Webhook processing failed", {
      message: error.message,
      stack: error.stack,
      clickshipResponse: responseData
    });

    return res.status(statusCode).json({
      error: "Failed to process webhook",
      message: error.message,
      details: responseData || null
    });
  }
});

app.use((err, _req, res, _next) => {
  console.error("Unhandled error", err);
  res.status(500).json({ error: "Internal server error" });
});

module.exports = app;