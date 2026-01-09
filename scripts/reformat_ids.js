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
    // Remove all non-alphanumeric characters (spaces, hyphens, etc.)
    return subject.replace(/[^a-zA-Z0-9]/g, '');
}

// Helper to generate hash from text
function generateHash(text) {
    if (!text) return '000000';
    // Use MD5 for speed, take first 8 chars for brevity while maintaining good uniqueness
    return crypto.createHash('md5').update(text).digest('hex').substring(0, 8);
}

// Check input
if (!fs.existsSync(INPUT_FILE)) {
    console.error(`❌ Input file not found: ${INPUT_FILE}`);
    process.exit(1);
}

// Read file content
let content = fs.readFileSync(INPUT_FILE, 'utf8');

// Robust parsing: Extract the array using Regex to handle "export const ENHANCED_QUESTIONS = [...]"
// This handles potentially multiline declarations and different spacing.
const match = content.match(/=\s*(\[[\s\S]*\])\s*;?\s*$/);

if (!match) {
    // If regex fails, try the index extraction as fallback
    const start = content.indexOf('[');
    const end = content.lastIndexOf(']');
    if (start !== -1 && end !== -1) {
        // Fallback successful
    } else {
        console.error("❌ Could not parse array from file. Format might be unexpected.");
        process.exit(1);
    }
}

const arrayString = match ? match[1] : content.substring(content.indexOf('['), content.lastIndexOf(']') + 1);

let questions;
try {
    // Use Function constructor for safer evaluation of JS object syntax (handles unquoted keys)
    questions = new Function('return ' + arrayString)();
    console.log(`✅ Successfully parsed ${questions.length} questions.`);
} catch (e) {
    console.error("❌ Error parsing JS object:", e);
    console.error("Snippet:", arrayString.substring(0, 100));
    process.exit(1);
}

// Transform IDs
const ids = new Set();
// Track processing stats
let missingSubject = 0;
let duplicatesHandled = 0;

const updatedQuestions = questions.map(q => {
    // Generate new ID
    const subjectCode = normalizeSubject(q.subject);
    if (subjectCode === 'Unknown') missingSubject++;

    const yearCode = q.year || '0000';

    // Ensure we handle special characters in question text for consistency
    const cleanQ = (q.q || '').trim();
    const textHash = generateHash(cleanQ);

    let newId = `${subjectCode}_${yearCode}_${textHash}`;

    // Collision handling
    let counter = 1;
    const originalId = newId;
    while (ids.has(newId)) {
        newId = `${originalId}_${counter}`;
        counter++;
        duplicatesHandled++;
    }
    ids.add(newId);

    // Return new object with new ID at the top
    const { id, ...rest } = q;
    return {
        id: newId, // String ID
        ...rest
    };
});

// Serialize back to file
// We use JSON.stringify for the output to ensure valid, standard format.
const outputContent = `export const ENHANCED_QUESTIONS = ${JSON.stringify(updatedQuestions, null, 2)};`;

fs.writeFileSync(OUTPUT_FILE, outputContent);
console.log(`✅ Saved updated database to ${OUTPUT_FILE}`);
console.log(`📊 Stats:`);
console.log(`   - Total Questions: ${updatedQuestions.length}`);
console.log(`   - Missing Subjects: ${missingSubject}`);
console.log(`   - Hash Collisions Resolved: ${duplicatesHandled}`);
console.log(`ℹ️  Review the new file. If satisfied, rename it to replace the original.`);
console.log(`⚠️  IMPORTANT: You must update your app code to handle STRING IDs instead of Numbers!`);
