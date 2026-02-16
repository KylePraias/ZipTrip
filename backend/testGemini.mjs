import 'dotenv/config';
import { GoogleGenAI } from "@google/genai";


const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function main() {
  const model = ai.getGenerativeModel({ model: "gemini-2.0-flash" });

  const result = await model.generateContent("Explain how AI works in a few words");

  const response = await result.response;
  const text = response.text();

  console.log(text);
}

main().catch(console.error);
