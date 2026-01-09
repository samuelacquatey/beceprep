import fs from 'fs/promises';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfLib = require('pdf-parse');
const pdf = pdfLib.default || pdfLib;
console.log('Using PDF Parser:', typeof pdf);


const RAW_DIR = path.join(process.cwd(), 'curriculum', 'raw');

async function convertPdf(filename, outputName) {
    console.log(`Converting ${filename} to text...`);
    try {
        const dataBuffer = await fs.readFile(path.join(RAW_DIR, filename));
        const data = await pdf(dataBuffer);

        const outputPath = path.join(RAW_DIR, outputName);
        await fs.writeFile(outputPath, data.text);

        console.log(`✅ Converted to ${outputName} (${data.numpages} pages)`);
        return outputPath;
    } catch (error) {
        console.error(`❌ Function failed for ${filename}:`);
        console.error(error.message);
        console.error(error.stack);
    }
}

// Usage: node scripts/pdf_to_text.js input.pdf output.txt
const args = process.argv.slice(2);
if (args.length < 2) {
    console.log("Usage: node scripts/pdf_to_text.js <input.pdf> <output.txt>");
} else {
    convertPdf(args[0], args[1]);
}
