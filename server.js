const express = require("express");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(express.urlencoded({ extended: true}));
app.use(express.json());

app.post("/sms", (req, res) => {
    const {text, from, to} = req.body;

    const response = `Thanks for this message : ${text}`;

    const responseXml = `
        <Response>
            <Message>${response}</Message>
        </Response>
    `;

    res.set("Content-Type", "text/xml");
    res.send(responseXml);
});

app.get("/", (req, res) => {
    res.send("UjuziAI is running...")
});

app.listen(PORT, () => {
    console.log(`Server running at port ${PORT}...`)
});

