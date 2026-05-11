import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const wordBankPath = path.join(__dirname, 'src', 'data', 'wordBank.json');
const audioDir = path.join(__dirname, 'public', 'assets', 'audio');

if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

const data = JSON.parse(fs.readFileSync(wordBankPath, 'utf8'));

// Usage: node generate_lesson_audio.js <YOUR_GOOGLE_CLOUD_API_KEY> OR pass via environment
const apiKey = process.argv[2] || process.env.VITE_GOOGLE_TTS_API_KEY;

if (!apiKey) {
  console.error("\n❌ ERROR: Google Cloud API Key missing.");
  console.error("Usage: node generate_lesson_audio.js <API_KEY>");
  console.error("   OR: VITE_GOOGLE_TTS_API_KEY=xxx node generate_lesson_audio.js\n");
  process.exit(1);
}

const generateTTS = async (text, voiceType, filename) => {
  const filePath = path.join(audioDir, filename);
  
  if (fs.existsSync(filePath)) {
    console.log(`⏭️  Skipping: ${filename} (Already Cached)`);
    return;
  }

  let pitch = 0.0;
  let speakingRate = 0.95; // Core baseline rate

  if (voiceType === 'jedi') {
    // Deep, slow mystical narrator voice
    pitch = -2.5;
    speakingRate = 0.88;
  } else if (voiceType === 'assessment') {
    // Standard clarity rate
    pitch = 0.0;
    speakingRate = 0.95;
  }

  // High Fidelity Configuration using verified Premium flagship neural engine
  const config = {
    input: { 
      text
    },
    voice: { 
      languageCode: 'en-US', 
      name: 'en-US-Journey-F' // Certified operational without preview allowlisting
    },
    audioConfig: { 
      audioEncoding: 'MP3', 
      speakingRate: speakingRate
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
      'Content-Type': 'application/json',
      'x-goog-user-project': 'secret-bloom-474313-m8' // Explicit user project override
    };
    if (isBearerToken) {
      fetchHeaders['Authorization'] = `Bearer ${apiKey}`;
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

  // Step 1: Process each section individually
  for (const tier of data.tiers) {
    for (const section of tier.sections) {
      if (section.lessonScript && section.id) {
        // Naming pattern: lesson_t1_s1.mp3
        const filename = `lesson_${section.id}.mp3`;
        await generateTTS(section.lessonScript, 'jedi', filename);
        // Rate limiting protection
        await new Promise(r => setTimeout(r, 1000)); 
      }
      
      // Step 2: Process specific individual words inside each section
      for (const wordObj of section.words) {
         const speechString = `${wordObj.word}. ${wordObj.definition} ${wordObj.sentence} The word is: ${wordObj.word}.`;
         // Consistent safe filename regex
         const safeWord = wordObj.word.toLowerCase().replace(/[^a-z0-9]/g, '');
         const filename = `word_${safeWord}.mp3`;
         await generateTTS(speechString, 'assessment', filename);
         await new Promise(r => setTimeout(r, 1000));
      }
    }
  }
  
  console.log("\n🎉 PRE-RENDERING PIPELINE COMPLETE! All static audio generated.");
};

run().catch(err => console.error("FATAL PIPELINE ERROR:", err));
