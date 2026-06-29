const express = require("express");
const app = express();

app.get("/", (_req, res) => {
  res.status(200).json({ ok: true, message: "Node.js on Vercel is working" });
});

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true, health: "pass" });
});

module.exports = app;