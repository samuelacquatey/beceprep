
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.error("❌ GEMINI_API_KEY is not set in environment variables.");
    console.error("Please create a .env file in the root directory with your key.");
    // We don't exit here to allow importing this file, but functions will fail.
}

const genAI = new GoogleGenerativeAI(API_KEY || "dummy_key");

const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// ...

export async function generateJSON(prompt) {
    if (!API_KEY) throw new Error("Missing API Key");

    // Debug log
    console.log(`Using Key: ${API_KEY.substring(0, 4)}...`);

    const jsonPrompt = `${prompt}
  
    IMPORTANT: Respond ONLY with valid JSON. Do not include markdown formatting (like \`\`\`json).
    `;

    try {
        const result = await model.generateContent(jsonPrompt);
        const response = await result.response;
        let text = response.text();

        text = text.replace(/^```json/, '').replace(/```$/, '').trim();

        return JSON.parse(text);
    } catch (error) {
        console.error("Error calling Gemini:", error);
        if (error.response) {
            // console.error(await error.response.text()); // Caution with await in catch if not generic
        }
        throw error;
    }
}
