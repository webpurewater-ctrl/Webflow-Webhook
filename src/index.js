const config = require("./config");
const app = require("./app");

app.listen(config.port, () => {
  console.log(`Webhook server listening on port ${config.port}`);
});
