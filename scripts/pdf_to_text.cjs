const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

const RAW_DIR = path.join(process.cwd(), 'curriculum', 'raw');

async function convertPdf(filename, outputName) {
    console.log(`Converting ${filename} to text...`);
    try {
        const filePath = path.join(RAW_DIR, filename);
        if (!fs.existsSync(filePath)) {
            console.error(`File not found: ${filePath}`);
            return;
        }
        const dataBuffer = fs.readFileSync(filePath);

        console.log('PDF Library Type:', typeof pdf);

        const data = await pdf(dataBuffer);

        const outputPath = path.join(RAW_DIR, outputName);
        fs.writeFileSync(outputPath, data.text);

        console.log(`✅ Converted to ${outputName} (${data.numpages} pages)`);
    } catch (error) {
        console.error(`❌ Conversion failed:`);
        console.error(error);
    }
}

// Usage: node scripts/pdf_to_text.cjs input.pdf output.txt
const args = process.argv.slice(2);
if (args.length < 2) {
    console.log("Usage: node scripts/pdf_to_text.cjs <input.pdf> <output.txt>");
} else {
    convertPdf(args[0], args[1]);
}
