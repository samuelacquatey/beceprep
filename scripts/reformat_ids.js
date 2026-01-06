import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const INPUT_FILE = path.join(__dirname, '../public/js/data/questionBank.js');
const OUTPUT_FILE = path.join(__dirname, '../public/js/data/questionBank_new.js');

// Helper to normalize subject names for IDs
// e.g., "Social Studies" -> "SocialStudies"
// "ICT" -> "ICT"
// "English Language" -> "EnglishLanguage"
function normalizeSubject(subject) {
    if (!subject) return 'Unknown';
    return subject.replace(/[^a-zA-Z0-9]/g, '');
}

// Helper to generate hash from text
function generateHash(text) {
    if (!text) return '000000';
    return crypto.createHash('md5').update(text).digest('hex').substring(0, 8);
}

// Check input
if (!fs.existsSync(INPUT_FILE)) {
    console.error(`❌ Input file not found: ${INPUT_FILE}`);
    process.exit(1);
}

// Read file content
let content = fs.readFileSync(INPUT_FILE, 'utf8');

// Parse the content
// We look for the array definition. It might start with "export const ENHANCED_QUESTIONS = ["
// We'll extract everything from the first '[' to the last '];' or ']'
const start = content.indexOf('[');
const end = content.lastIndexOf(']');

if (start === -1 || end === -1) {
    console.error("❌ Could not parse array from file. Format might be unexpected.");
    process.exit(1);
}

const arrayString = content.substring(start, end + 1);

let questions;
try {
    // Since the file uses quoted keys (valid JSON), we can use JSON.parse
    questions = JSON.parse(arrayString);
    console.log(`✅ Successfully parsed ${questions.length} questions.`);
} catch (e) {
    console.error("❌ Error parsing JSON array:", e.message);
    console.error("Start snippet:", arrayString.substring(0, 200));
    console.error("End snippet:", arrayString.substring(arrayString.length - 200));
    process.exit(1);
}

// Transform IDs
let updatedCount = 0;
const ids = new Set();

const updatedQuestions = questions.map(q => {
    // Generate new ID
    const subjectCode = normalizeSubject(q.subject);
    const yearCode = q.year || '0000';
    // Ensure we handle special characters in question text for consistency
    const cleanQ = (q.q || '').trim();
    const textHash = generateHash(cleanQ);

    let newId = `${subjectCode}_${yearCode}_${textHash}`;

    // Collision handling (rare but possible with short hash)
    let counter = 1;
    while (ids.has(newId)) {
        newId = `${subjectCode}_${yearCode}_${textHash}_${counter}`;
        counter++;
    }
    ids.add(newId);

    // Return new object with new ID at the top (for readability)
    const { id, ...rest } = q;
    return {
        id: newId, // String ID
        ...rest
    };
});

// Serialize back to file
// We use JSON.stringify, replacing valid JSON structure.
// WE MUST REMOVE QUOTES FROM KEYS to match original style? 
// Actually, valid JSON (quoted keys) is perfectly valid JS. 
// "export const ENHANCED_QUESTIONS = [...]" is valid JS even with quoted keys.
// So we will stick with JSON.stringify for safety and ease.
const outputContent = `export const ENHANCED_QUESTIONS = ${JSON.stringify(updatedQuestions, null, 2)};`;

fs.writeFileSync(OUTPUT_FILE, outputContent);
console.log(`✅ Saved updated database to ${OUTPUT_FILE}`);
console.log(`ℹ️  Review the new file. If satisfied, rename it to replace the original.`);
console.log(`⚠️  IMPORTANT: You must update your app code to handle STRING IDs instead of Numbers!`);
