import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const files = [
  'wordBank_2nd.json',
  'wordBank_3rd.json',
  'wordBank_4th.json',
  'wordBank_5th.json',
  'wordBank_6th.json'
];

// ID-Based Mapping for pristine educational rules
const ruleUpdates = {
  // --- 2nd Grade Polishing ---
  'g2_t1_s2': 'Listen closely for the distinct short vowel sounds in the middle of these CVC words, like /o/ in dog, /u/ in sun, and /e/ in bed.',
  'g2_t4_s1': 'Practice reading and spelling these essential high-frequency sight words instantly by locking their visual patterns into memory.',
  'g2_t4_s2': 'Master these common sight words by spotting their unique letter combinations and practicing them every day.',

  // --- 3rd Grade Polishing ---
  'g3_t3_s2': 'Slice directly between double consonants (VC/CV) to break words into simple, manageable syllables!',
  'g3_t4_s1': 'Listen carefully to the context of the sentence to know exactly which homophone spelling matches the intended meaning.',

  // --- 4th Grade Mismatched Fixes ---
  'g4_t1_s7': "Behold the power of Magic E! When an 'E' sits silently at the end of a word, it jumps backward over one consonant to make the first vowel shout its long name!",
  'g4_t2_s4': "Armor up your words! The prefix 'un-' flips a word to its exact opposite (not), while 're-' means to do it again!",
  'g4_t3_s4': "Defeat the lazy Schwa! When the letter 'A' is in an unstressed syllable, it gives up its true sound to make a lazy 'uh' grunt!",
  'g4_t3_s6': "Master the Schwa grunt! The letters 'O' and 'U' can hide behind the lazy 'uh' sound in unstressed syllables, so rely on your visual memory!",
  'g4_t4_s4': "Resolve states of nature and growth: separate the woodland animal ('deer') and coloring ('dye') from affections ('dear') and blooming plants ('flower').",
  'g4_t4_s5': "Differentiate physical form, delivery, and silent letters: separate curing ('heal') and letters ('mail') from foot parts ('heel') and warriors ('knight').",
  'g4_t4_s6': "Use context clues to navigate homophone pairs: separate fruits ('pear') and viewing actions ('see', 'stare') from sets ('pair'), water ('sea'), and steps ('stair').",

  // --- 6th Grade Generic/Pun Replacements ---
  'g6_t1_s3': "Illuminate your spelling! The Greek root 'photo-' means light, forming the foundation for optical and energy terms.",
  'g6_t3_s2': "Recognize grammatical stress shifts! Spoken syllable stress frequently shifts when a word transforms from a noun to a verb or adjective.",
  'g6_t4_s1': "Evaluate synonym intensity! Distinguish closely related vocabulary words by analyzing their precise degree of emotional or physical strength.",
  'g6_t5_s1': "Master academic analytical verbs! These advanced terms are essential for evaluating evidence, breaking down complex arguments, and synthesizing information.",
  'g6_t5_s2': "Understand structural terminology! Use these high-level concepts to describe how complex systems, frameworks, and operations are constructed and facilitated."
};

function updateRules() {
  files.forEach(filename => {
    const filePath = path.join(__dirname, 'src', 'data', filename);
    if (!fs.existsSync(filePath)) {
      console.log(`File not found: ${filePath}`);
      return;
    }

    let data;
    try {
      data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (err) {
      console.error(`Error parsing ${filename}:`, err);
      return;
    }

    let updatedCount = 0;
    data.tiers.forEach(tier => {
      tier.sections.forEach(section => {
        const sectionId = section.id;
        if (ruleUpdates[sectionId]) {
          section.rule = ruleUpdates[sectionId];
          updatedCount++;
          console.log(`[${filename}] Updated rule for section: ${sectionId} (${section.name})`);
        }
      });
    });

    if (updatedCount > 0) {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
      console.log(`🎉 Successfully saved ${filename} with ${updatedCount} rule updates.\n`);
    } else {
      console.log(`[${filename}] No rule updates needed.\n`);
    }
  });
}

updateRules();
