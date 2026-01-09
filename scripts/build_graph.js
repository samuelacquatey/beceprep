import { generateJSON } from './gemini_client.js';
import fs from 'fs/promises';
import path from 'path';
import url from 'url';

const TOPICS_DIR = path.join(process.cwd(), 'curriculum', 'topics');

async function enhanceTopicGraph(filename) {
    const filePath = path.join(TOPICS_DIR, filename);
    console.log(`Enhancing graph for ${filename}...`);

    try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const topicData = JSON.parse(fileContent);

        // Flatten topics for the prompt to save tokens and make it easier for LLM
        // But we need to maintain structure for the final output. 
        // Actually, let's just send the whole JSON structure if it's not too huge.
        // Or better: Extract list of Topic IDs and Names/Outcomes.

        const prompt = `
        You are helping design a learning progression for JHS students preparing for Ghana’s BECE.
        Here is a structured JSON of topics.
        
        For each "topic" object in the nested structure, I need you to ADD two fields:
        - "foundations": an array of topic IDs *from this same list* that are prerequisites.
        - "next": an array of topic IDs *from this same list* that logically follow it.
        
        Foundations should be few (1–3), realistic, and match how the skills are usually taught in JHS in Ghana.
        
        Output the EXACT SAME JSON structure, but with these new fields added to every topic.
        
        INPUT JSON:
        ${JSON.stringify(topicData)}
        `;

        const enhancedData = await generateJSON(prompt);

        const outPath = filePath.replace('.json', '_with_graph.json');
        await fs.writeFile(outPath, JSON.stringify(enhancedData, null, 2));
        console.log(`✅ Generated enhanced graph at ${outPath}`);

    } catch (error) {
        console.error(`❌ Failed to enhance graph for ${filename}:`, error);
    }
}

// Example usage: node scripts/build_graph.js topics_mathematics_jhs3.json
const args = process.argv.slice(2);
if (args.length < 1) {
    console.log("Usage: node scripts/build_graph.js <topics_filename>");
} else {
    enhanceTopicGraph(args[0]);
}
