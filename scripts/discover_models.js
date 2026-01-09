import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

const candidates = [
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-1.0-pro",
    "gemini-pro",
    "models/gemini-1.5-flash",
    "models/gemini-pro"
];

async function discover() {
    console.log(`Checking API Key: ${API_KEY ? 'Present' : 'Missing'}`);

    for (const modelName of candidates) {
        process.stdout.write(`Testing: ${modelName} ... `);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            // Set maxOutputTokens to 1 to be fast
            const result = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: 'hi' }] }],
                generationConfig: { maxOutputTokens: 1 }
            });
            await result.response;
            console.log("✅ SUCCESS");
            console.log(`RECOMMENDATION: Use "${modelName}"`);
            process.exit(0);
        } catch (error) {
            console.log("❌ FAIL");
            if (modelName === candidates[candidates.length - 1]) {
                console.error("All models failed.");
                console.error("Last Error:", error.message);
                // Dump response if available
                if (error.response) {
                    // console.error(await error.response.text());
                }
            }
        }
    }
}

discover();
