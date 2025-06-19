const africastalking = require("africastalking");
const express = require("express");
require("dotenv").config();

const ModelClient = require("@azure-rest/ai-inference").default;
const { AzureKeyCredential } = require("@azure/core-auth");
const { isUnexpected } = require("@azure-rest/ai-inference");

const app = express();
const PORT = process.env.PORT || 8000;

//initialize Africa's Talking
const AT = africastalking({
    apiKey: process.env.AFRICASTALKING_API_KEY,
    username: process.env.AFRICASTALKING_USERNAME
});

//AI Client setup(Github Marketplace Open AI)
const endpoint = "https://models.github.ai/inference";
const model = "openai/gpt-4.1";
const toeken = process.env.GITHUB_TOKEN;

//initialize model client(allows us to make request to open AI in hosted in azure accessed through github)
const client = ModelClient(endpoint, new AzureKeyCredential(toeken));

// Middleware to parse incoming data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//A function to get respose from open ai model in azure through github
async function getAIResponse(userMessage) {
    const response = await client.path("/chat/completions").post({
        body: {
            messages: [{
                role: "system", content: "You're a helpful Kenyan SMS assistant, who fully understands kenyan culture, and languages(English, Kiswahili, Sheng, Mixture of English and Kiswahili). Keep responses short, 160 characters or less.",
            }, {
                role: "user", content: userMessage,
            }],
            temperature: 0.7,
            top_p: 1,
            model: model,
        },
    });

    if (isUnexpected(response)) {
        throw new Error("AI error: " + JSON.stringify(response.body.error));
    };

    return response.body.choices[0].message.content.trim();
};

app.post("/sms", async (req, res) => {
    const {to, from, text} = req.body;

    console.log(`Incoming message from ${from}: ${text}`);

    try {
        const reply = await getAIResponse(text);

        //sending message back to the user
        const result = await AT.SMS.send({
            to: from,
            message: reply,
            from: process.env.SENDER_ID || null,
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
