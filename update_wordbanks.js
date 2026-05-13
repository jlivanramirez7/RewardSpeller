/**
 * @file update_wordbanks.js
 * @description Automated data-engineering utility script. Batch updates `lessonImage` and `imagePath`
 * properties across active split curriculum JSON files (`wordBank_2nd.json`, `wordBank_5th.json`)
 * to enforce grade-specific asset naming conventions (`g2_tierX.png`, `g5_tX_sY.png`).
 *
 * @example
 * // Execution syntax:
 * node update_wordbanks.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const grades = ['2nd', '5th'];

grades.forEach(grade => {
  const prefix = grade === '2nd' ? 'g2' : 'g5';
  const filePath = path.join(__dirname, 'src', 'data', `wordBank_${grade}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  data.tiers.forEach((tier, tIdx) => {
    const tNum = tIdx + 1;
    tier.lessonImage = `/assets/images/${prefix}_tier${tNum}.png`;
    tier.sections.forEach((section, sIdx) => {
      const sNum = sIdx + 1;
      section.imagePath = `/assets/images/${prefix}_t${tNum}_s${sNum}.png`;
    });
  });

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Successfully updated ${filePath}`);
});
