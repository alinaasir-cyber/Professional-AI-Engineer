import OpenAI from "openai";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import readline from "readline";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});


const outputDir = path.join(process.cwd(), "images");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

async function generateImages() {
  rl.question("Enter a theme for your image (e.g., cyberpunk cityscape): ", async (theme) => {
    if (!theme.trim()) {
      console.log("Theme cannot be empty!");
      rl.close();
      return;
    }

    console.log(`\nGenerating images for theme: "${theme}"...\n`);

    try {
      
      console.log("Generating Standard Square Image with DALL-E 3...");
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: theme,
        n: 1,
        size: "1024x1024",
        response_format: "b64_json",
      });

      const base64Data = response.data[0].b64_json;
      const buffer = Buffer.from(base64Data, "base64");
      const filename = path.join(outputDir, `${Date.now()}-square.png`);
      
      
      fs.writeFileSync(filename, buffer);
      console.log(`Saved: ${filename}`);
      console.log(`Revised Prompt used: ${response.data[0].revised_prompt}\n`);

      
      console.log("Generating Landscape Image...");
      const landscapeRes = await openai.images.generate({
        model: "dall-e-3",
        prompt: `${theme}, cinematic lighting, highly detailed`,
        n: 1,
        size: "1792x1024", 
        response_format: "b64_json",
      });

      const landscapeBuffer = Buffer.from(landscapeRes.data[0].b64_json, "base64");
      const landscapeFilename = path.join(outputDir, `${Date.now()}-landscape.png`);
      fs.writeFileSync(landscapeFilename, landscapeBuffer);
      console.log(`Saved: ${landscapeFilename}\n`);

      
      console.log("All requested images have been successfully generated and saved in the 'images/' directory!");

    } catch (error) {
      console.error("Error generating images:", error);
    } finally {
      rl.close();
    }
  });
}

generateImages();

