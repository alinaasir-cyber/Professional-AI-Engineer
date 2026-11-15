import OpenAI from "openai";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


const baseDir = path.join(process.cwd(), "studio_output");
const textDir = path.join(baseDir, "texts");
const imageDir = path.join(baseDir, "images");
const audioDir = path.join(baseDir, "audio");

[baseDir, textDir, imageDir, audioDir].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

async function runAIContentStudio() {
  const topic = "The Future of Artificial Intelligence in Software Development";
  console.log(`========================================`);
  console.log(` Starting AI Content Studio for Topic:`);
  console.log(` "${topic}"`);
  console.log(`========================================\n`);

  try {
    
    console.log("1. Generating Article and Summary...");
    const textResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an expert tech writer and content creator." },
        { role: "user", content: `Write a short article about: ${topic}. Include a title, introduction, 2 key points, and a conclusion.` },
      ],
    });
    const articleText = textResponse.choices[0].message.content;
    fs.writeFileSync(path.join(textDir, "article.md"), articleText);
    console.log("-> Article saved to studio_output/texts/article.md\n");

    
    console.log("2. Generating Visual Design (Header Image with DALL-E 3)...");
    const imageResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt: `Futuristic concept art representing ${topic}, professional, modern tech aesthetic`,
      n: 1,
      size: "1024x1024",
      response_format: "b64_json",
    });
    const imageBuffer = Buffer.from(imageResponse.data[0].b64_json, "base64");
    fs.writeFileSync(path.join(imageDir, "header_image.png"), imageBuffer);
    console.log("-> Header image saved to studio_output/images/header_image.png\n");

    
    console.log("3. Generating Audio Narration (Text-to-Speech)...");
    const narrationText = "Welcome to our AI Content Studio production. Today we explore the future of artificial intelligence in software development.";
    const audioResponse = await openai.audio.speech.create({
      model: "tts-1",
      voice: "alloy",
      input: narrationText,
    });
    const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
    fs.writeFileSync(path.join(audioDir, "narration.mp3"), audioBuffer);
    console.log("-> Narration audio saved to studio_output/audio/narration.mp3\n");

    
    console.log("========================================");
    console.log(" 100% Success! AI Content Suite Exported Successfully.");
    console.log(" All text, images, and audio files are securely stored in the 'studio_output/' directory.");
    console.log("========================================");

  } catch (error) {
    console.error("Error executing AI Content Studio:", error);
  }
}
