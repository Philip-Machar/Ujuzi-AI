require("dotenv").config();

const { Mistral } = require("@mistralai/mistralai");

const apiKey = process.env.MISTRAL_API_KEY;

const client = new Mistral({ apiKey: apiKey });

async function testMistral() {
    const chatResponse = await client.chat.complete({
      model: "mistral-large-latest",
      messages: [{ role: "user", content: "what are malaria symptoms?" }],
    });
    console.log("Chat:", chatResponse.choices[0].message.content);
  }

testMistral();