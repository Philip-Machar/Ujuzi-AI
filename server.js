const africastalking = require("africastalking");
const express = require("express");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 8000;

//initialize Africa's Talking
const AT = africastalking({
    apiKey: process.env.AFRICASTALKING_API_KEY,
    username: process.env.AFRICASTALKING_USERNAME
});

// Middleware to parse incoming data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.post("/sms", async (req, res) => {
    const {to, from, text} = req.body;

    console.log(`Incoming message from ${from}: ${text}`);

    const reply = "Hi there 👋, How can I help you today 😁";

    try {
        //sending message back to the user
        const result = await AT.SMS.send({
            to: from,
            message: reply,
            from: process.env.SENDER_ID || "46399"
        });

        //respoding to AT webhook
        res.status(200).send("OK");

        console.log(JSON.stringify(result, null, 2));
    } catch (error) {
        console.error("Error sending SMS: ", error);
        res.status(500).send("Failed to send reply");
    };
});

app.listen(PORT, () => {
    console.log(`Server running at port ${PORT}...`);
});
