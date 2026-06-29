const express = require("express");
const morgan = require("morgan");

const config = require("./config");
const { isValidWebflowSignature } = require("./webflowSignature");
const { mapWebflowOrderToClickShipSettlement } = require("./orderMapper");
const { createClickShipClient } = require("./clickshipClient");

const app = express();

function withTimeout(promiseFactory, timeoutMs) {
  return new Promise((resolve, reject) => {
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      const timeoutError = new Error("Webhook processing exceeded allowed time window");
      timeoutError.code = "PROCESSING_TIMEOUT";
      reject(timeoutError);
    }, timeoutMs);

    Promise.resolve()
      .then(() => promiseFactory())
      .then((result) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(result);
      })
      .catch((error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(error);
      });
  });
}

function getStatusCode(error) {
  if (error.code === "PROCESSING_TIMEOUT" || error.code === "ECONNABORTED") {
    return 504;
  }

  if (error.name === "AbortError") {
    return 504;
  }

  return error.response?.status || 500;
}

function getErrorPayload(error) {
  return {
    error: "Failed to process webhook",
    message: error.message,
    details: error.response?.data || null,
  };
}

app.disable("x-powered-by");
app.use(morgan("combined"));
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = Buffer.from(buf);
    },
  })
);

app.get("/", (_req, res) => {
  return res.json({
    status: "ok",
    service: "webflow-clickship-webhook",
    endpoints: ["/health", "/webhooks/webflow/orders"],
  });
});

app.get("/health", (_req, res) => {
  return res.json({
    status: "ok",
    service: "webflow-clickship-webhook",
    timestamp: new Date().toISOString(),
  });
});

app.post("/webhooks/webflow/orders", async (req, res) => {
  try {
    if (!config.clickship.baseUrl || !config.clickship.apiKey) {
      return res.status(500).json({
        error: "ClickShip is not configured",
        message: "Set CLICKSHIP_BASE_URL and CLICKSHIP_API_KEY in environment variables",
      });
    }

    const signaturePayload = req.rawBody || Buffer.from(JSON.stringify(req.body || {}), "utf8");
    const isValid = isValidWebflowSignature(
      signaturePayload,
      req.headers,
      config.webflowWebhookSecret
    );

    if (!isValid) {
      return res.status(401).json({ error: "Invalid webhook signature" });
    }

    const settlementPayload = mapWebflowOrderToClickShipSettlement(req.body);
    const clickshipClient = createClickShipClient(config.clickship);

    const clickshipResponse = await withTimeout(
      () => clickshipClient.submitSettlement(settlementPayload),
      config.webhookProcessingTimeoutMs
    );

    return res.status(200).json({
      status: "forwarded",
      externalOrderId: settlementPayload.externalOrderId,
      clickship: clickshipResponse,
    });
  } catch (error) {
    const statusCode = getStatusCode(error);

    console.error("Webhook processing failed", {
      message: error.message,
      code: error.code,
      stack: error.stack,
      clickshipResponse: error.response?.data || null,
    });

    return res.status(statusCode).json(getErrorPayload(error));
  }
});

app.use((err, _req, res, _next) => {
  console.error("Unhandled error", {
    message: err.message,
    code: err.code,
    stack: err.stack,
    response: err.response?.data || null,
  });

  if (res.headersSent) {
    return;
  }

  return res.status(getStatusCode(err)).json(getErrorPayload(err));
});

module.exports = app;