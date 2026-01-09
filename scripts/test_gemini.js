import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;

console.log("Loaded API Key:", API_KEY ? `${API_KEY.substring(0, 5)}...` : "UNDEFINED");

async function test() {
    if (!API_KEY) {
        console.error("No API Key found!");
        return;
    }

    const genAI = new GoogleGenerativeAI(API_KEY);
    // Try listing models if possible, or just generate
    // Note: listModels is on the genAI instance in some versions, or not available in client SDK.
    // Let's just try generation.

    const possibleModels = [
        "gemini-1.5-flash",
        "gemini-1.5-pro",
    ];


    for (const modelName of possibleModels) {
        console.log(`\nTesting model: ${modelName}...`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hello, are you there?");
            const response = await result.response;
            console.log(`✅ Success with ${modelName}:`, response.text());
            return; // Exit on first success
        } catch (error) {
            console.error(`❌ Failed with ${modelName}:`);
            console.error(error.message || error);
        }
    }
}

test();
