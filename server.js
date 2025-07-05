const express = require("express");
require("dotenv").config();

// Import SMS functionality from talk-sms.js
const smsHandler = require("./src/talk-sms");

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware to parse incoming data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// SMS functionality has been moved to src/talk-sms.js

// Route for handling SMS webhooks
app.post("/sms", smsHandler.handleSmsWebhook);

app.listen(PORT, () => {
  console.log(`Server running at port ${PORT}...`);
});
