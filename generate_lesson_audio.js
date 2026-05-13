/* global process, Buffer */
import fs from 'fs';
import path from 'path';
import { convertTextToSsml } from './src/services/ssmlHelper.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, 'src', 'data');
const audioDir = path.join(__dirname, 'public', 'assets', 'audio');

if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

// Usage: node generate_lesson_audio.js <YOUR_GOOGLE_CLOUD_API_KEY> OR pass via environment
const apiKey = process.argv[2] || process.env.GOOGLE_TTS_API_KEY;

if (!apiKey) {
  console.error("\n❌ ERROR: Google Cloud API Key missing.");
  console.error("Usage: node generate_lesson_audio.js <API_KEY>");
  console.error("   OR: GOOGLE_TTS_API_KEY=xxx node generate_lesson_audio.js\n");
  process.exit(1);
}

const generateTTS = async (text, voiceType, filename) => {
  const filePath = path.join(audioDir, filename);
  
  if (fs.existsSync(filePath)) {
    console.log(`⏭️  Skipping: ${filename} (Already Cached)`);
    return;
  }

  let ssmlRate = '95%';

  if (voiceType === 'jedi') {
    // Deep, slow mystical narrator voice
    ssmlRate = '88%';
  } else if (voiceType === 'assessment') {
    // Standard clarity rate
    ssmlRate = '95%';
  }

  // High Fidelity Configuration using verified Premium flagship neural engine
  const config = {
    input: { 
      ssml: convertTextToSsml(text, ssmlRate, voiceType)
    },
    voice: { 
      languageCode: 'en-US', 
      name: 'en-US-Neural2-D'
    },
    audioConfig: { 
      audioEncoding: 'MP3'
    },
  };

  try {
    console.log(`🎙️  Synthesizing: ${filename}...`);
    
    // DYNAMIC AUTH ROUTING: Seamlessly handle standard Keys vs robust OAuth2 Bearer Tokens
    const isBearerToken = apiKey.startsWith('ya29.') || apiKey.startsWith('AQ.') || apiKey.length > 50;
    
    // Remove ?key= parameter if using modern bearer headers to satisfy REST security protocols
    const baseUrl = `https://texttospeech.googleapis.com/v1/text:synthesize`;
    const fetchUrl = isBearerToken ? baseUrl : `${baseUrl}?key=${apiKey}`;
    
    const fetchHeaders = { 
      'Content-Type': 'application/json'
    };
    if (isBearerToken) {
      fetchHeaders['Authorization'] = `Bearer ${apiKey}`;
      fetchHeaders['x-goog-user-project'] = 'secret-bloom-474313-m8'; // Apply override only to Bearer contexts
    }

    const response = await fetch(fetchUrl, {
      method: 'POST',
      headers: fetchHeaders,
      body: JSON.stringify(config)
    });

    const result = await response.json();
    
    if (result.error) {
      console.error(`❌ Failed ${filename}:`, result.error.message);
    } else if (result.audioContent) {
      fs.writeFileSync(filePath, Buffer.from(result.audioContent, 'base64'));
      console.log(`✅ Saved: ${filename}`);
    }
  } catch (err) {
    console.error(`💥 Network error generating ${filename}:`, err.message);
  }
};

const run = async () => {
  console.log("\n🚀 LAUNCHING HIGH-FIDELITY TTS GENERATOR pipeline...");
  console.log("---------------------------------------------------\n");

  try {
    const files = fs.readdirSync(dataDir).filter(file => file.startsWith('wordBank_') && file.endsWith('.json'));

    if (files.length === 0) {
      console.warn("⚠️  Warning: No files matching 'wordBank_*.json' found in", dataDir);
      return;
    }

    for (const file of files) {
      const filePath = path.join(dataDir, file);
      console.log(`\n📂 Processing file: ${file}`);

      let data;
      try {
        data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch (err) {
        console.error(`❌ Error parsing JSON from ${file}:`, err.message);
        continue;
      }

      if (!Array.isArray(data.tiers)) {
        console.warn(`⚠️  Warning: File ${file} does not contain an array of 'tiers'. Skipping.`);
        continue;
      }

      // Step 1: Process each section individually
      for (const tier of data.tiers) {
        if (!Array.isArray(tier.sections)) {
          console.warn(`⚠️  Warning: Tier ${tier.id || 'unknown'} does not contain an array of 'sections'. Skipping.`);
          continue;
        }
        for (const section of tier.sections) {
          if (!section.id) {
            console.warn(`⚠️  Warning: A section in tier ${tier.id || 'unknown'} is missing 'id'. Skipping section.`);
            continue;
          }

          if (section.lessonScript) {
            // Naming pattern: lesson_t1_s1.mp3
            const filename = `lesson_${section.id}.mp3`;
            await generateTTS(section.lessonScript, 'jedi', filename);
            // Rate limiting protection
            await new Promise(r => setTimeout(r, 1000)); 
          }
          
          if (Array.isArray(section.words)) {
            // Step 2: Process specific individual words inside each section
            for (const wordObj of section.words) {
               if (!wordObj.word) {
                 console.warn(`⚠️  Warning: A word object in section ${section.id} is missing 'word' property. Skipping word.`);
                 continue;
               }
               
               const definition = wordObj.definition || '';
               const sentence = wordObj.sentence || '';
               
               if (!wordObj.definition || !wordObj.sentence) {
                 console.warn(`⚠️  Warning: Missing definition or sentence for word '${wordObj.word}' in section ${section.id}.`);
               }
               
               const speechString = `${wordObj.word}. ${definition} ${sentence} The word is: ${wordObj.word}.`;
               // Consistent safe filename regex
               const safeWord = wordObj.word.toLowerCase().replace(/[^a-z0-9]/g, '');
               const filename = `word_${section.id}_${safeWord}.mp3`;
               await generateTTS(speechString, 'assessment', filename);
               await new Promise(r => setTimeout(r, 1000));
            }
          }
        }
      }
    }
  } catch (err) {
    console.error("💥 Error reading data directory:", err.message);
  }
  
  console.log("\n🎉 PRE-RENDERING PIPELINE COMPLETE! All static audio generated.");
};

run().catch(err => console.error("FATAL PIPELINE ERROR:", err));
