import { generateJSON } from './gemini_client.js';
import fs from 'fs/promises';
import path from 'path';

const CURRICULUM_RAW_DIR = path.join(process.cwd(), 'curriculum', 'raw');
const OUTPUT_DIR = path.join(process.cwd(), 'curriculum', 'topics');

async function processSubject(filename, subject, level) {
    console.log(`Processing ${subject} ${level} from ${filename}...`);

    try {
        const filePath = path.join(CURRICULUM_RAW_DIR, filename);
        const rawText = await fs.readFile(filePath, 'utf-8');

        // Note: For very large files, we might need to chunk this. 
        // For now, assuming the text fits context (Gemini 1.5 Pro has huge context, 1.0 Pro has 32k).
        // If rawText is > 30k chars, we should warn or split.

        const prompt = `
        You are helping build a BECE preparation app for Ghana (ClassMaster Prep).
        Below is the official ${subject} JHS${level} curriculum text from GES/NaCCA.
        Extract a structured list of strands, substrands and specific topics/skills suitable for BECE preparation.
        
        For each topic, provide:
        - a short machine-readable id (e.g., ${subject.toUpperCase().slice(0, 4)}_JHS${level}_TOPIC_NAME),
        - a human-readable name,
        - 1–3 clear learning outcomes in simple language.
        
        Output as JSON query following this exact schema:
        {
            "subject": "${subject}",
            "levels": [
                {
                    "class": "JHS${level}",
                    "strands": [
                        {
                            "name": "Strand Name",
                            "substrands": [
                                {
                                    "name": "Substrand Name",
                                    "topics": [
                                        {
                                            "id": "UNIQUE_ID",
                                            "name": "Topic Name",
                                            "learning_outcomes": ["outcome 1", "outcome 2"]
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        }

        CURRICULUM TEXT:
        ${rawText.slice(0, 30000)} 
        // TRUNCATING TO SECURE TOKEN LIMIT FOR INITIAL PASS. 
        // IN PRODUCTION, USE FULL TEXT OR CHUNKING.
        `;

        const data = await generateJSON(prompt);

        // Ensure output dir exists
        await fs.mkdir(OUTPUT_DIR, { recursive: true });

        const validJson = JSON.stringify(data, null, 2);
        const outPath = path.join(OUTPUT_DIR, `topics_${subject.toLowerCase()}_jhs${level}.json`);

        await fs.writeFile(outPath, validJson);
        console.log(`✅ Generated ${outPath}`);

    } catch (error) {
        console.error(`❌ Failed to process ${filename}:`, error);
    }
}

// Example usage: node scripts/generate_topics.js math_jhs3.txt Mathematics 3
const args = process.argv.slice(2);
if (args.length < 3) {
    console.log("Usage: node scripts/generate_topics.js <filename> <Subject> <Level>");
    console.log("Example: node scripts/generate_topics.js maths_jhs.txt Mathematics 3");
} else {
    processSubject(args[0], args[1], args[2]);
}
