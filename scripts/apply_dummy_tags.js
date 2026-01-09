import fs from 'fs/promises';
import path from 'path';

const QUESTIONS_FILE = path.join(process.cwd(), 'bece-react', 'src', 'data', 'questionBank.js');
const PUBLIC_QUESTIONS_FILE = path.join(process.cwd(), 'public', 'js', 'data', 'questionBank.js');
const TOPICS_FILE = path.join(process.cwd(), 'curriculum', 'topics', 'topics_mathematics_jhs3_with_graph.json');

async function applyTags() {
    console.log("Loading questions...");
    let content = await fs.readFile(QUESTIONS_FILE, 'utf-8');

    // safe extraction of the array
    const match = content.match(/export const ENHANCED_QUESTIONS = (\[[\s\S]*?\]);/);
    if (!match) throw new Error("Could not find ENHANCED_QUESTIONS array");

    // Parse questions
    // Note: This relies on the file being valid JS/JSON-like object literals
    // We'll use a safer eval wrapper
    const questions = new Function(`return ${match[1]}`)();

    console.log(`Loaded ${questions.length} questions.`);

    // Load topics to get IDs
    const topicData = JSON.parse(await fs.readFile(TOPICS_FILE, 'utf-8'));
    let topicIds = [];
    function extractIds(node) {
        if (node.topics) topicIds.push(...node.topics.map(t => t.id));
        if (node.substrands) node.substrands.forEach(extractIds);
        if (node.strands) node.strands.forEach(extractIds);
        if (node.levels) node.levels.forEach(extractIds);
    }
    extractIds(topicData);
    console.log(`Available Topics:`, topicIds);

    // Apply tags to MATH questions
    let taggedCount = 0;
    const updatedQuestions = questions.map(q => {
        // Simple heuristic: if Subject is Math, assign a random topic from our list
        // In reality, this would be the AI's job.
        if ((q.subject && q.subject.toUpperCase().includes('MATH')) || (q.subject && q.subject.toUpperCase().includes('MATHEMATICS'))) {
            // Deterministic assignment based on ID to be stable
            const topicIndex = (q.id || 0) % topicIds.length;
            return {
                ...q,
                topicId: topicIds[topicIndex],
                topic: topicIds[topicIndex] // populate legacy field too just in case
            };
        }
        return q;
    });

    // Reconstruct file content
    // We need to write valid JS. JSON.stringify key quoting might differ from original but is valid JS.
    const newContent = `// [DEPRECATED] This file is preserved for PWA offline fallback strategies ONLY.
// Do not import this directly in components. Use 'useQuestions' hook instead.
// The primary source of truth is now Firestore (via useQuestions).
export const ENHANCED_QUESTIONS = ${JSON.stringify(updatedQuestions, null, 2)};
`;

    // Write to both React and Public locations
    await fs.writeFile(QUESTIONS_FILE, newContent);
    // await fs.writeFile(PUBLIC_QUESTIONS_FILE, newContent); // Optional if they are symlinked or separate

    console.log(`✅ Updated questionBank.js with dummy tags for Math.`);
}

applyTags().catch(console.error);
