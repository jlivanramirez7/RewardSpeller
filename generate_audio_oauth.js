const fs = require('fs');
const path = require('path');

// ==========================================
// PASTE YOUR OAUTH CLIENT ID AND SECRET HERE
// ==========================================
const CLIENT_ID = "PASTE_YOUR_CLIENT_ID_HERE";
const CLIENT_SECRET = "PASTE_YOUR_CLIENT_SECRET_HERE";
// ==========================================

const wordBankPath = path.join(__dirname, 'src', 'data', 'wordBank.json');
const audioDir = path.join(__dirname, 'public', 'assets', 'audio');

if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

const data = JSON.parse(fs.readFileSync(wordBankPath, 'utf8'));

// 1. Get Device Code
const getDeviceCode = async () => {
  const res = await fetch('https://oauth2.googleapis.com/device/code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/cloud-platform'
    })
  });
  return await res.json();
};

// 2. Poll for Token
const pollForToken = async (deviceCode, intervalMs) => {
  while (true) {
    await new Promise(r => setTimeout(r, intervalMs * 1000));
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        device_code: deviceCode,
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
      })
    });
    const result = await res.json();
    if (result.access_token) return result.access_token;
    if (result.error !== 'authorization_pending') {
      throw new Error(result.error_description || result.error);
    }
  }
};

// 3. Generate Audio
const generateTTS = async (text, type, filename, accessToken) => {
  let voiceName = 'en-US-Journey-F';
  let pitch = 0;
  if (type === 'jedi') {
    voiceName = 'en-US-Wavenet-D';
    pitch = -2.0;
  } else if (type === 'assessment') {
    voiceName = 'en-US-Wavenet-D';
    pitch = 0.0;
  }

  const filePath = path.join(audioDir, filename);
  if (fs.existsSync(filePath)) {
    console.log(`Skipping ${filename}, already exists.`);
    return;
  }

  const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      input: { text },
      voice: { languageCode: 'en-US', name: voiceName },
      audioConfig: { audioEncoding: 'MP3', pitch, speakingRate: 0.85 },
    })
  });

  const result = await response.json();
  if (result.error) {
    console.error(`Error generating ${filename}:`, result.error.message);
  } else if (result.audioContent) {
    fs.writeFileSync(filePath, Buffer.from(result.audioContent, 'base64'));
    console.log(`Successfully generated: ${filename}`);
  }
};

const run = async () => {
  if (CLIENT_ID.includes("PASTE_YOUR")) {
    console.error("ERROR: You must edit this file to paste your Client ID and Secret at the top!");
    process.exit(1);
  }

  console.log("Requesting Google Auth...");
  const authInfo = await getDeviceCode();
  
  if (authInfo.error) {
    console.error("Auth Error:", authInfo);
    return;
  }

  console.log("\n=============================================");
  console.log(`Please go to this URL: ${authInfo.verification_url}`);
  console.log(`And enter this code: ${authInfo.user_code}`);
  console.log("=============================================\n");
  console.log("Waiting for you to log in on your browser...");

  const accessToken = await pollForToken(authInfo.device_code, authInfo.interval);
  console.log("\nSuccessfully Authenticated! Beginning Download...");

  for (const tier of data.tiers) {
    if (tier.lessonScript) {
      await generateTTS(tier.lessonScript, 'jedi', `lesson_tier${tier.id}.mp3`, accessToken);
      await new Promise(r => setTimeout(r, 1000));
    }
    for (const section of tier.sections) {
      for (const wordObj of section.words) {
        const textToSpeak = `${wordObj.word}. ${wordObj.definition} ${wordObj.sentence} The word is: ${wordObj.word}.`;
        const safeWord = wordObj.word.toLowerCase().replace(/[^a-z0-line]/g, '');
        await generateTTS(textToSpeak, 'assessment', `word_${safeWord}.mp3`, accessToken);
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }
  
  console.log("All audio generated successfully! You can close this script.");
};

run().catch(console.error);
