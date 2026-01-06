import { initializeApp, cert, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { ENHANCED_QUESTIONS } from '../src/data/questionBank.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to Service Account Key
const serviceAccountPath = path.resolve(__dirname, '../../serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
    console.error(`Error: Service account key not found at ${serviceAccountPath}`);
    process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
console.log('Service Account Project ID:', serviceAccount.project_id);

initializeApp({
    credential: cert(serviceAccount)
});

// Target 'bece-prod-db'
const db = getFirestore(getApp(), 'bece-prod-db');
const COLLECTION_NAME = 'questions';

// Test connection
try {
    const collections = await db.listCollections();
    console.log('Connected to Firestore. Collections:', collections.map(c => c.id).join(', '));
} catch (e) {
    console.error('Connection failed:', e.message);
}

// Helper to create deterministic ID
function generateQuestionId(question) {
    // Combine fields to create a unique signature
    // normalize strings to lowercase/trimmed to match duplicates despite minor formatting
    const signature = `${question.subject}_${question.year}_${question.q}`
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();

    return crypto.createHash('md5').update(signature).digest('hex').substring(0, 12); // Short hash is enough
}

async function uploadQuestions() {
    console.log(`Starting upload of ${ENHANCED_QUESTIONS.length} questions...`);
    const batchSize = 400; // Firestore batch limit is 500
    let totalUploaded = 0;

    // Create chunks
    for (let i = 0; i < ENHANCED_QUESTIONS.length; i += batchSize) {
        const chunk = ENHANCED_QUESTIONS.slice(i, i + batchSize);
        const batch = db.batch();

        chunk.forEach(q => {
            // GENERATE NEW ID
            const newId = generateQuestionId(q);

            // Assign new ID to the object (important for frontend usage)
            const questionData = {
                ...q,
                id: newId,
                originalId: q.id // Keep reference just in case
            };

            const docRef = db.collection(COLLECTION_NAME).doc(newId);
            batch.set(docRef, questionData);
        });

        try {
            await batch.commit();
            totalUploaded += chunk.length;
            console.log(`Uploaded ${totalUploaded}/${ENHANCED_QUESTIONS.length} questions.`);
        } catch (error) {
            console.error('Batch upload failed:', error);
        }
    }

    console.log('Upload complete!');
}

uploadQuestions().catch(console.error);
