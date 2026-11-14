import OpenAI from "openai";
import dotenv from "dotenv";
import readline from "readline";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function runAssistant() {
  rl.question("Enter a topic for your content assistant: ", async (topic) => {
    if (!topic.trim()) {
      console.log("Topic cannot be empty!");
      rl.close();
      return;
    }

    console.log(`\nGenerating blog outline for "${topic}" using streaming...\n`);

    try {
      const stream = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are a professional content creator." },
          { role: "user", content: `Create a detailed blog outline about: ${topic}` },
        ],
        stream: true,
      });

      let fullOutline = "";
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        process.stdout.write(content);
        fullOutline += content;
      }

      console.log("\n\n----------------------------------------\n");
      console.log("Generating 2-sentence summary...");

      
      const summaryResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "Summarize the given text in exactly two sentences." },
          { role: "user", content: fullOutline },
        ],
      });

      const summary = summaryResponse.choices[0].message.content;
      console.log(`\nSummary:\n${summary}`);

      console.log("\n----------------------------------------\n");

     
      askFollowUp(topic);
    } catch (error) {
      console.error("Error communicating with OpenAI API:", error);
      rl.close();
    }
  });
}

function askFollowUp(topic) {
  rl.question("\nAsk a follow-up question about the topic (or type 'exit' to quit): ", async (question) => {
    if (question.toLowerCase() === "exit") {
      console.log("Goodbye!");
      rl.close();
      return;
    }

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: `You are an expert assistant answering questions about the topic: ${topic}` },
          { role: "user", content: question },
        ],
      });

      console.log(`\nAnswer:\n${response.choices[0].message.content}`);
      askFollowUp(topic);
    } catch (error) {
      console.error("Error:", error);
      rl.close();
    }
  });
}

runAssistant();