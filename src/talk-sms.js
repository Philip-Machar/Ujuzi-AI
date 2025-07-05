const africastalking = require("africastalking");
require("dotenv").config();

// Import Mistral client from mistral.js
const { client } = require("./mistral");

//initialize Africa's Talking
const AT = africastalking({
  apiKey: process.env.AFRICASTALKING_API_KEY,
  username: process.env.AFRICASTALKING_USERNAME,
});

//current conversation memory storage
const conversationHistory = new Map();

/**
 * Get AI response using Mistral LLM
 * @param {string} userMessage - The message from the user
 * @param {string} phone - The phone number of the user
 * @returns {Promise<string>} - The AI response
 */
async function getAIResponse(userMessage, phone) {
  const systemPrompt =
    "You're a helpful Kenyan SMS assistant, who fully understands kenyan culture, and languages(English, Kiswahili, Sheng, Mixture of English and Kiswahili). Keep responses short, 160 characters or less.";
  const history = conversationHistory.get(phone) || [];

  const messages = [
    { role: "system", content: systemPrompt },
    ...history.slice(-3).flatMap((entry) => [
      { role: "user", content: entry.user },
      { role: "assistant", content: entry.bot },
    ]),
    { role: "user", content: userMessage },
  ];

  // Using the imported Mistral client
  const response = await client.chat.complete({
    model: "mistral-large-latest",
    messages: messages,
    temperature: 0.7,
    top_p: 1,
  });

  let aiReply = response.choices[0].message.content.trim();

  //check if response is more than 160 characters and trim it
  if (aiReply.length > 160) {
    aiReply = aiReply.slice(0, 157) + "...";
  }

  //update the conversation history
  const newHistory = [
    ...history,
    {
      user: userMessage,
      bot: aiReply,
      time: new Date(),
    },
  ];

  if (newHistory.length > 5) newHistory.shift();
  conversationHistory.set(phone, newHistory);

  return aiReply;
}

/**
 * Handle SMS webhook request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function handleSmsWebhook(req, res) {
  const { to, from, text } = req.body;

  console.log(`Incoming message from ${from}: ${text}`);

  try {
    const reply = await getAIResponse(text, from);

    //sending message back to the user
    const result = await AT.SMS.send({
      to: from,
      message: reply,
      from: process.env.SENDER_ID || null,
    });

    //responding to AT webhook
    res.status(200).send("OK");

    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Error sending SMS: ", error);
    res.status(500).send("Failed to send reply");
  }
}

// Export the SMS functionality
module.exports = {
  handleSmsWebhook,
  getAIResponse,
  conversationHistory
};
