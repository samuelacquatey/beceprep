import fs from 'fs/promises';
import path from 'path';

const QUESTIONS_FILE = path.join(process.cwd(), 'public', 'js', 'data', 'questionBank.js');
const MAPPING_FILE = path.join(process.cwd(), 'curriculum', 'mappings', 'mapping_Mathematics_temp.json');

async function applyTags() {
    try {
        console.log("Reading question bank...");
        let fileContent = await fs.readFile(QUESTIONS_FILE, 'utf-8');

        console.log("Reading mappings...");
        const mappings = JSON.parse(await fs.readFile(MAPPING_FILE, 'utf-8'));

        // create a map for faster lookup
        const mappingMap = new Map();
        mappings.forEach(m => mappingMap.set(String(m.questionId), m));

        // Since we want to modify the file content in place without re-generating the whole JS file structure strictly from JSON,
        // we can locate the array again, parse it, modify objects, and re-serialize just the array.

        const match = fileContent.match(/export const ENHANCED_QUESTIONS = (\[[\s\S]*?\]);/);
        if (!match) throw new Error("Could not find ENHANCED_QUESTIONS array");

        const questionsParams = match[1];
        // Use a safe evaluation to get the object
        // NOTE: This assumes the file content inside the array is valid JSON-like JS (e.g. unquoted keys are possible)
        // If we use simple JSON.parse it might fail if keys aren't quoted.
        // Let's rely on the fact that our previous script output valid structure, or use `eval`.
        // Since this is a build script, new Function is acceptable.

        const questions = new Function(`return ${questionsParams}`)();

        let updatedCount = 0;
        const updatedQuestions = questions.map(q => {
            const map = mappingMap.get(String(q.id));
            if (map && q.subject.toLowerCase() === 'mathematics') {
                updatedCount++;
                return {
                    ...q,
                    topicId: map.topicId,
                    subSkill: map.subSkill
                }; // Add new fields
            }
            return q;
        });

        console.log(`Updated ${updatedCount} questions with new tags.`);

        // Re-serialize with some formatting
        const newArrayString = JSON.stringify(updatedQuestions, null, 2);

        // Preserve variable declaration part
        const newFileContent = fileContent.replace(match[0], `export const ENHANCED_QUESTIONS = ${newArrayString};`);

        await fs.writeFile(QUESTIONS_FILE, newFileContent);
        console.log("✅ Successfully updated questionBank.js");

    } catch (error) {
        console.error("❌ Error applying tags:", error);
    }
}

applyTags();
