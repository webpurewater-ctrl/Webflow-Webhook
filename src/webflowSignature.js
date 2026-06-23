const crypto = require("crypto");

function signatureFromHeaders(headers) {
  return (
    headers["x-webflow-signature"] ||
    headers["x-webhook-signature"] ||
    headers["webflow-signature"] ||
    ""
  );
}

function normalizeSignature(signature) {
  const cleaned = signature.trim();
  if (!cleaned) {
    return "";
  }
  if (cleaned.startsWith("sha256=")) {
    return cleaned.slice("sha256=".length);
  }
  return cleaned;
}

function isValidWebflowSignature(rawBodyBuffer, headers, secret) {
  if (!secret) {
    return true;
  }

  const headerSignature = normalizeSignature(signatureFromHeaders(headers));
  if (!headerSignature) {
    return false;
  }

  const digest = crypto
    .createHmac("sha256", secret)
    .update(rawBodyBuffer)
    .digest("hex");

  const a = Buffer.from(digest, "utf8");
  const b = Buffer.from(headerSignature, "utf8");

  if (a.length !== b.length) {
    return false;
  }

  return crypto.timingSafeEqual(a, b);
}

module.exports = {
  isValidWebflowSignature
};
