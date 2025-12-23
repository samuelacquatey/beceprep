
import fs from 'fs/promises';
import path from 'path';

const INPUT_FILE = './src/data/scraped_questions.json';
const OUTPUT_FILE = './src/data/questionBank.js';

async function cleanData() {
    console.log('🧹 Starting data cleanup...');

    try {
        const rawData = await fs.readFile(INPUT_FILE, 'utf-8');
        const questions = JSON.parse(rawData);

        console.log(`Loaded ${questions.length} questions.`);

        const cleanedQuestions = questions.map(q => {
            // Create a deep copy of options to modify
            let newOptions = [...q.options];

            // Fix Option A (Index 0): Remove "B. ..." if present
            if (newOptions[0]) {
                newOptions[0] = newOptions[0].split(/\s+B\.\s+/)[0].trim();
            }

            // Fix Option B (Index 1): Remove "C. ..." if present (just in case)
            if (newOptions[1]) {
                newOptions[1] = newOptions[1].split(/\s+C\.\s+/)[0].trim();
            }

            // Fix Option C (Index 2): Remove "D. ..." if present
            if (newOptions[2]) {
                newOptions[2] = newOptions[2].split(/\s+D\.\s+/)[0].trim();
            }

            // Fix Option D (Index 3): Usually clean, but good measure
            if (newOptions[3]) {
                newOptions[3] = newOptions[3].split(/\s+E\.\s+/)[0].trim();
            }

            return {
                ...q,
                options: newOptions
            };
        });

        console.log(`Cleaned ${cleanedQuestions.length} questions.`);

        // Check a few examples
        console.log('Example 1 (Cleaned):', JSON.stringify(cleanedQuestions[0], null, 2));

        // Format for JS export
        const fileContent = `export const ENHANCED_QUESTIONS = ${JSON.stringify(cleanedQuestions, null, 2)};`;

        await fs.writeFile(OUTPUT_FILE, fileContent);
        console.log(`✅ Saved clean data to ${OUTPUT_FILE}`);

    } catch (error) {
        console.error('Error cleaning data:', error);
    }
}

cleanData();
