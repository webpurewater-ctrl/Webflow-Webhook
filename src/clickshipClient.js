const axios = require("axios");

function createClickShipClient(clickshipConfig) {
  const timeout = Number(clickshipConfig.timeoutMs || clickshipConfig.webhookProcessingTimeoutMs || 15000);

  const client = axios.create({
    baseURL: clickshipConfig.baseUrl,
    timeout,
    headers: {
      "x-api-key": clickshipConfig.apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  return {
    async submitSettlement(payload) {
      const response = await client.post("/settlements", payload);
      return response.data;
    },
  };
}

module.exports = { createClickShipClient };