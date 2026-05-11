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
