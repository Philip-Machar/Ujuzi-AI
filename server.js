const express = require("express");
const africastalking = require("africastalking");
require("dotenv").config();

const ModelClient = require("@azure-rest/ai-inference").default;
const { AzureKeyCredential } = require("@azure/core-auth");
const { isUnexpected } = require("@azure-rest/ai-inference");

const app = express();
const PORT = process.env.PORT || 8000;

// Africa's Talking setup
const AT = africastalking({
  apiKey: process.env.AFRICASTALKING_API_KEY,
  username: process.env.AFRICASTALKING_USERNAME,
});

// AI client setup (GitHub Marketplace OpenAI)
const endpoint = "https://models.github.ai/inference";
const token = process.env.GITHUB_TOKEN;
const model = "openai/gpt-4.1";

const client = ModelClient(endpoint, new AzureKeyCredential(token));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// AI function to get response from GitHub OpenAI model
async function getAIResponse(userMessage) {
  const response = await client.path("/chat/completions").post({
    body: {
      messages: [
        { role: "system", content: "You're a helpful SMS assistant. Keep responses short and friendly." },
        { role: "user", content: userMessage },
      ],
      temperature: 0.7,
      top_p: 1,
      model: model,
    },
  });

  if (isUnexpected(response)) {
    throw new Error("AI error: " + JSON.stringify(response.body.error));
  }

  return response.body.choices[0].message.content.trim();
}

// SMS webhook
app.post("/sms", async (req, res) => {
  const { from, text } = req.body;

  console.log(`📩 Incoming SMS from ${from}: ${text}`);

  try {
    const aiReply = await getAIResponse(text);

    const sms = await AT.SMS.send({
      to: from,
      message: aiReply,
      from: process.env.SENDER_ID || "46399",
    });

    console.log("📤 Sent reply:", JSON.stringify(sms, null, 2));

    res.status(200).send("OK");
  } catch (err) {
    console.error("❌ Error:", err.message);
    await AT.SMS.send({
      to: from,
      message: "Sorry, I had a problem replying. Please try again shortly.",
      from: process.env.SENDER_ID || "46399",
    });
    res.status(500).send("Error");
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
