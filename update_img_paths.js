/**
 * @file update_img_paths.js
 * @description Legacy data maintenance utility script. Standardizes section image asset naming patterns (`tierX_secY.png`)
 * across legacy monolithic curriculum word bank structures (`src/data/wordBank.json`).
 *
 * @example
 * // Execution syntax:
 * node update_img_paths.js
 *
 * @note Note that active runtime curriculums are split into grade-specific files (e.g., `wordBank_3rd.json`).
 */

import fs from 'fs';

const bankPath = '/usr/local/google/home/ivanramirez/.gemini/jetski/scratch/SummerSpelling/src/data/wordBank.json';
const data = JSON.parse(fs.readFileSync(bankPath, 'utf8'));

data.tiers.forEach(tier => {
  tier.sections.forEach((section, index) => {
    section.imagePath = `/assets/images/tier${tier.id}_sec${index + 1}.png`;
  });
});

fs.writeFileSync(bankPath, JSON.stringify(data, null, 2), 'utf8');
console.log('Successfully updated all section image paths in wordBank.json.');
