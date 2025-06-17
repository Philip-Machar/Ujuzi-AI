const express = require("express");
require("dotenv").config();
const africastalking = require("africastalking");

const app = express();
const PORT = process.env.PORT || 8000;

// Initialize Africa's Talking
const AT = africastalking({
    apiKey: process.env.AFRICASTALKING_API_KEY,
    username: process.env.AFRICASTALKING_USERNAME,
});

// Middleware to parse incoming data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Handle incoming SMS
app.post("/sms", async (req, res) => {
    const { text, from } = req.body;

    console.log("Incoming message:", text, "from:", from);

    const reply = "Hey there, how can I help you?";

    try {
        // Send SMS reply using Africa's Talking
        const result = await AT.SMS.send({
            to: from,
            message: reply,
            from: process.env.SENDER_ID || "46399"
        });

        console.log("Message sent:", JSON.stringify(result, null, 2));

        // Respond to Africa’s Talking webhook
        res.status(200).send("OK");
    } catch (error) {
        console.error("Error sending SMS:", error);
        res.status(500).send("Failed to send reply");
    }
});

// Basic test route
app.get("/", (req, res) => {
    res.send("UjuziAI is running...");
});

app.listen(PORT, () => {
    console.log(`Server running at port ${PORT}...`);
});
