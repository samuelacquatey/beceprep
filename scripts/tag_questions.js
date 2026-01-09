import { generateJSON } from './gemini_client.js';
import fs from 'fs/promises';
import path from 'path';

// Paths
const QUESTIONS_FILE = path.join(process.cwd(), 'bece-react', 'src', 'data', 'questionBank.js');
const TOPICS_DIR = path.join(process.cwd(), 'curriculum', 'topics');
const OUTPUT_DIR = path.join(process.cwd(), 'curriculum', 'mappings');

// Helper to extract JSON from the JS file (brittle but effective for simple export const)
async function loadQuestions() {
    const content = await fs.readFile(QUESTIONS_FILE, 'utf-8');
    // Find the array part: export const ENHANCED_QUESTIONS = [...]
    const match = content.match(/export const ENHANCED_QUESTIONS = (\[[\s\S]*?\]);/);
    if (!match) throw new Error("Could not find ENHANCED_QUESTIONS array");

    // We need to evaluate this safely or parse it. 
    // Since the file is JS, it might contain comments or unquoted keys.
    // Using Function to eval in a contained scope is risky but works for data files.
    // Better: use a regex to replace unquoted keys with quoted keys?
    // Let's try Function approach as it's a dev-tool script.
    const questions = new Function(`return ${match[1]}`)();
    return questions;
}

// Batch processing
async function tagBatch(questions, topicList, subject) {
    // Simplify topic list for prompt to save tokens
    const simplifiedTopics = topicList.map(t => `${t.id}: ${t.name} (${t.learning_outcomes.join(', ')})`).join('\n');

    // Simplify questions
    const simplifiedQuestions = questions.map(q => ({
        id: q.id,
        text: q.q,
        options: q.options,
        answer: q.options[q.a] || "Unknown"
    }));

    const prompt = `
    You are tagging exam questions for a BECE prep app.
    Here is the topic list for ${subject}:
    ${simplifiedTopics}

    For each question below, choose:
    1. The single best 'topicId' from the list above.
    2. An optional short 'subSkill' (e.g., "adding unlike fractions").

    Questions:
    ${JSON.stringify(simplifiedQuestions)}

    Return output as a JSON array EXACTLY matching this format:
    [{"questionId": "id_from_input", "topicId": "topic_id_from_list", "subSkill": "..."}]
    
    Only choose IDs from the provided list.
    `;

    return await generateJSON(prompt);
}

async function run(subject, topicFile) {
    try {
        console.log(`Loading questions...`);
        const allQuestions = await loadQuestions();

        // Filter by subject
        const subjectQuestions = allQuestions.filter(q => q.subject.toUpperCase() === subject.toUpperCase());
        console.log(`Found ${subjectQuestions.length} questions for ${subject}.`);

        // Load topics
        const topicPath = path.join(TOPICS_DIR, topicFile);
        const topicData = JSON.parse(await fs.readFile(topicPath, 'utf-8'));

        // Flatten topic hierarchy to a list
        let flatTopics = [];
        // Recursive extract
        function extractTopics(node) {
            if (node.topics) {
                flatTopics.push(...node.topics);
            }
            if (node.substrands) node.substrands.forEach(extractTopics);
            if (node.strands) node.strands.forEach(extractTopics);
            if (node.levels) node.levels.forEach(extractTopics);
        }
        extractTopics(topicData);

        console.log(`Loaded ${flatTopics.length} topics from graph.`);

        // Ensure output dir
        await fs.mkdir(OUTPUT_DIR, { recursive: true });

        // Process in batches
        const BATCH_SIZE = 10; // Gemini limit safe
        let allMappings = [];

        for (let i = 0; i < subjectQuestions.length; i += BATCH_SIZE) {
            const batch = subjectQuestions.slice(i, i + BATCH_SIZE);
            console.log(`Processing batch ${i} - ${i + BATCH_SIZE}...`);

            try {
                const mappings = await tagBatch(batch, flatTopics, subject);
                allMappings = [...allMappings, ...mappings];

                // Backup save
                await fs.writeFile(
                    path.join(OUTPUT_DIR, `mapping_${subject}_temp.json`),
                    JSON.stringify(allMappings, null, 2)
                );

                // Rate limit pause
                await new Promise(r => setTimeout(r, 2000));

            } catch (err) {
                console.error(`Batch failed:`, err);
            }
        }

        // Final save
        await fs.writeFile(
            path.join(OUTPUT_DIR, `mapping_${subject}_final.json`),
            JSON.stringify(allMappings, null, 2)
        );
        console.log("✅ Tagging complete!");

    } catch (err) {
        console.error("Error:", err);
    }
}

// Usage: node scripts/tag_questions.js Mathematics topics_mathematics_jhs3_with_graph.json
const args = process.argv.slice(2);
if (args.length < 2) {
    console.log("Usage: node scripts/tag_questions.js <Subject> <TopicGraphFile>");
} else {
    run(args[0], args[1]);
}
