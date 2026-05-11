const fs = require('fs');
const path = require('path');

const wordBankPath = path.join(__dirname, 'src', 'data', 'wordBank.json');
const audioDir = path.join(__dirname, 'public', 'assets', 'audio');

// Make sure audio directory exists
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

const data = JSON.parse(fs.readFileSync(wordBankPath, 'utf8'));

// Get API Key from args
const apiKey = process.argv[2];

if (!apiKey) {
  console.error("Please provide a Google Cloud API Key as an argument.");
  console.error("Usage: node generate_audio.js <API_KEY>");
  process.exit(1);
}

const generateTTS = async (text, type, filename) => {
  let voiceName = 'en-US-Journey-F';
  let pitch = 0;
  let speakingRate = 0.85;

  if (type === 'jedi') {
    voiceName = 'en-US-Wavenet-D';
    pitch = -2.0;
    speakingRate = 0.85;
  } else if (type === 'assessment') {
    voiceName = 'en-US-Wavenet-D';
    pitch = 0.0;
    speakingRate = 0.85;
  }

  const filePath = path.join(audioDir, filename);
  if (fs.existsSync(filePath)) {
    console.log(`Skipping ${filename}, already exists.`);
    return;
  }

  try {
    const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode: 'en-US', name: voiceName },
        audioConfig: { audioEncoding: 'MP3', pitch, speakingRate },
      })
    });

    const result = await response.json();
    
    if (result.error) {
      console.error(`Error generating ${filename}:`, result.error.message);
    } else if (result.audioContent) {
      fs.writeFileSync(filePath, Buffer.from(result.audioContent, 'base64'));
      console.log(`Successfully generated: ${filename}`);
    }
  } catch (error) {
    console.error(`Network error on ${filename}:`, error);
  }
};

const run = async () => {
  console.log("Starting static audio generation...");
  
  // 1. Generate Lesson Scripts
  for (const tier of data.tiers) {
    if (tier.lessonScript) {
      const filename = `lesson_tier${tier.id}.mp3`;
      await generateTTS(tier.lessonScript, 'jedi', filename);
      // Wait 1 second to avoid rate limits
      await new Promise(r => setTimeout(r, 1000));
    }
    
    // 2. Generate Spelling Words
    for (const section of tier.sections) {
      for (const wordObj of section.words) {
        const textToSpeak = `${wordObj.word}. ${wordObj.definition} ${wordObj.sentence} The word is: ${wordObj.word}.`;
        // Normalize filename (remove spaces/special chars)
        const safeWord = wordObj.word.toLowerCase().replace(/[^a-z0-line]/g, '');
        const filename = `word_${safeWord}.mp3`;
        
        await generateTTS(textToSpeak, 'assessment', filename);
        // Wait 1 second to avoid rate limits
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }
  
  console.log("Audio generation complete!");
};

run();
