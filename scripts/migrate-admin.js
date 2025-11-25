import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { ENHANCED_QUESTIONS } from '../public/js/data/questionBank.js';
import { readFile } from 'fs/promises';

const serviceAccountPath = './serviceAccountKey.json';

async function migrate() {
    console.log('🚀 Starting server-side migration...');

    try {
        // Check if service account exists
        try {
            await readFile(serviceAccountPath);
        } catch (e) {
            throw new Error('❌ serviceAccountKey.json not found! Please download it from Firebase Console > Project Settings > Service Accounts and place it in the root directory.');
        }

        // Initialize Firebase Admin
        const serviceAccount = JSON.parse(await readFile(serviceAccountPath, 'utf8'));

        console.log(`Using project ID: ${serviceAccount.project_id}`);

        initializeApp({
            credential: cert(serviceAccount)
        });

        // Connect to the specific named database
        const db = getFirestore('bece-prod-db');
        const batch = db.batch();
        const questionsRef = db.collection('questions');
        let count = 0;

        console.log(`Found ${ENHANCED_QUESTIONS.length} questions to migrate.`);

        for (const q of ENHANCED_QUESTIONS) {
            const docRef = questionsRef.doc(String(q.id));
            batch.set(docRef, {
                ...q,
                _migratedAt: new Date()
            });
            count++;
        }

        await batch.commit();
        console.log(`✅ Successfully migrated ${count} questions to Firestore!`);

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

migrate();
