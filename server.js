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
const token = process.env.GITHUB_TOKEN;

//initialize model client(allows us to make request to open AI in hosted in azure accessed through github)
const client = ModelClient(endpoint, new AzureKeyCredential(token));

// Middleware to parse incoming data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//current conversation memory storage
const conversationHistory = new Map();

//A function to get respose from open ai model in azure through github
async function getAIResponse(userMessage, phone) {

    const systemPrompt = "You're a helpful Kenyan SMS assistant, who fully understands kenyan culture, and languages(English, Kiswahili, Sheng, Mixture of English and Kiswahili). Keep responses short, 160 characters or less."
    const history = conversationHistory.get(phone) || [];

    const messages = [
            {role: "system", content: systemPrompt},
            ...history.slice(-3).flatMap((entry) => [
                {role: "user", content: entry.user},
                {role: "assistant", content: entry.bot}
            ]),
            {role: "user", content: userMessage}
        ]
    
    const response = await client.path("/chat/completions").post({
        body: {
            messages: messages,
            temperature: 0.7,
            top_p: 1,
            model: model,
        },
    });

    if (isUnexpected(response)) {
        throw new Error("AI error: " + JSON.stringify(response.body.error));
    };

    let aiReply = response.body.choices[0].message.content.trim();

    //check if respose is more that 160 characters and trim it
    if (aiReply.length > 160) {
        aiReply = aiReply.slice(0, 157) + "...";
    }

    //update the conversation history(how put in data to map in the first place)
    const newHistory = [...history, {
        user: userMessage,
        bot: aiReply,
        time: new Date()
    }];

    if (newHistory.length > 5) newHistory.shift();
    conversationHistory.set(phone, newHistory);


    return aiReply;
};

app.post("/sms", async (req, res) => {
    const {to, from, text} = req.body;

    console.log(`Incoming message from ${from}: ${text}`);

    try {
        const reply = await getAIResponse(text, from);

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
