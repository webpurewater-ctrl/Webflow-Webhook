const axios = require("axios");

function createClickShipClient(config) {
  const client = axios.create({
    baseURL: config.baseUrl,
    timeout: config.timeoutMs,
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json"
    }
  });

  async function submitSettlement(settlementPayload) {
    const response = await client.post(config.settlementPath, settlementPayload);
    return response.data;
  }

  return {
    submitSettlement
  };
}

module.exports = {
  createClickShipClient
};
