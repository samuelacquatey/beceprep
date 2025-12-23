
import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';

const START_URL = 'https://kuulchat.com/bece/';
const OUTPUT_FILE = './src/data/scraped_questions.json';

async function scrape() {
    console.log('🚀 Starting optimized scraper...');
    const browser = await puppeteer.launch({
        headless: "new",
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process'
        ]
    });
    const page = await browser.newPage();

    // Optimization: Block images, css, fonts to speed up loading
    await page.setRequestInterception(true);
    page.on('request', (req) => {
        if (['image', 'stylesheet', 'font', 'media'].includes(req.resourceType())) {
            req.abort();
        } else {
            req.continue();
        }
    });

    // 1. Get List of Quiz URLs
    console.log(`Navigating to ${START_URL}...`);
    // Changed to domcontentloaded and increased timeout
    await page.goto(START_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

    const quizLinks = await page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll('a'));
        return anchors
            .map(a => a.href)
            .filter(href => href.includes('/bece/questions/') && !href.endsWith('#') && !href.includes('?'))
            .filter((v, i, a) => a.indexOf(v) === i);
    });

    console.log(`Found ${quizLinks.length} quiz pages.`);

    const allQuestions = [];
    const linksToScrape = quizLinks;

    for (const [index, link] of linksToScrape.entries()) {
        console.log(`[${index + 1}/${linksToScrape.length}] Scraping ${link}...`);
        try {
            await page.goto(link, { waitUntil: 'domcontentloaded', timeout: 30000 });

            const pageQuestions = await page.evaluate(() => {
                const questions = [];
                const markButtons = Array.from(document.querySelectorAll('button')).filter(b => b.textContent.trim() === 'Mark');

                markButtons.forEach((btn) => {
                    try {
                        // 1. Extract Correct Answer
                        const onClick = btn.getAttribute('onclick');
                        const match = onClick && onClick.match(/mark\('(\d+)',\s*'([a-z])'/);
                        if (!match) return;

                        const [_, idStr, correctLetter] = match;
                        const correctIndex = ['a', 'b', 'c', 'd', 'e'].indexOf(correctLetter.toLowerCase());
                        const id = parseInt(idStr);

                        // 2. Find Container
                        let container = btn.parentElement;
                        while (container && !container.innerText.match(/^\d+\./)) {
                            container = container.parentElement;
                            if (!container) break;
                        }
                        if (!container) return;

                        // 3. Extract Text
                        const rawText = container.innerText;
                        const parts = rawText.split(/A\.\s/);
                        let questionText = parts[0].replace(/^\d+\.\s*/, '').trim();

                        // 4. Extract Options
                        const options = [];
                        ['A.', 'B.', 'C.', 'D.'].forEach((label) => {
                            const allDivs = Array.from(container.querySelectorAll('div, span, p'));
                            const optEl = allDivs.find(el => el.innerText.trim().startsWith(label));
                            if (optEl) {
                                options.push(optEl.innerText.replace(label, '').trim());
                            }
                        });

                        if (options.length < 4) return;

                        questions.push({
                            id,
                            q: questionText,
                            options: options,
                            a: correctIndex,
                        });

                    } catch (e) {
                        // ignore
                    }
                });
                return questions;
            });

            console.log(`   -> Found ${pageQuestions.length} questions.`);

            const urlParts = link.split('/').pop().split('-');
            const year = urlParts.find(p => p.match(/^\d+a?$/)) || '2023';
            const subject = urlParts.filter(p => !p.match(/^\d+a?$/)).join(' ').toUpperCase();

            const enrichedQuestions = pageQuestions.map(q => ({
                ...q,
                year,
                subject,
                difficulty: 'medium',
                explanation: ''
            }));

            allQuestions.push(...enrichedQuestions);

        } catch (err) {
            console.error(`   -> Failed to scrape ${link}: ${err.message}`);
        }
    }

    console.log(`Total questions scraped: ${allQuestions.length}`);
    await fs.writeFile(OUTPUT_FILE, JSON.stringify(allQuestions, null, 2));
    console.log(`Saved to ${OUTPUT_FILE}`);

    await browser.close();
}

scrape();
