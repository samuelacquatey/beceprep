
import fs from 'fs';
import { ENHANCED_QUESTIONS } from './public/js/data/questionBank_old.js';

const stats = {};

ENHANCED_QUESTIONS.forEach(q => {
    let subj = (q.subject || 'Unknown').trim().toUpperCase();
    let year = q.year;

    if (!stats[subj]) {
        stats[subj] = new Set();
    }
    stats[subj].add(year);
});

let output = "--- Available Years per Subject (questionBank_old.js) ---\n";
const sortedSubjects = Object.keys(stats).sort();

for (const subj of sortedSubjects) {
    // Filter out obviously bad years like undefined, null, or weird lengths if needed
    // keeping it raw for now to see truth.
    const sortedYears = Array.from(stats[subj])
        .filter(y => y) // remove null/undefined
        .sort()
        .reverse();

    output += `${subj}: [${sortedYears.join(', ')}]\n`;
}

fs.writeFileSync('years_report.txt', output);
console.log("Report saved to years_report.txt");
