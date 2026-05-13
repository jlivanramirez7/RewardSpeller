import fs from 'fs';


const bankPath = '/usr/local/google/home/ivanramirez/.gemini/jetski/scratch/SummerSpelling/src/data/wordBank.json';
const data = JSON.parse(fs.readFileSync(bankPath, 'utf8'));

data.tiers.forEach(tier => {
  tier.sections.forEach((section, index) => {
    section.id = `t${tier.id}_s${index + 1}`;
  });
});

fs.writeFileSync(bankPath, JSON.stringify(data, null, 2), 'utf8');
console.log(`Updated wordBank.json.`);
