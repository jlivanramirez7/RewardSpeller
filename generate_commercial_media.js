/* global process, Buffer */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const artifactsDir = '/usr/local/google/home/ivanramirez/.gemini/jetski/brain/d415520e-95b9-4362-960e-a1d3de227090';
const outputDir = path.join(__dirname, 'commercial_output');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const apiKey = args.find(arg => !arg.startsWith('--')) || process.env.GOOGLE_TTS_API_KEY;

if (!apiKey && !isDryRun) {
  console.error('\n❌ ERROR: Google Cloud / Gemini API Key missing.');
  console.error('Usage: node generate_commercial_media.js [--dry-run] <API_KEY>');
  console.error('   OR: GOOGLE_TTS_API_KEY=xxx node generate_commercial_media.js [--dry-run]\n');
  process.exit(1);
}

const ssmlVoiceover = `<speak>
  <voice emotion="weary" rate="slow">
    Spelling practice. Historically, a leading cause of premature graying in parents. <break time="400ms"/>
  </voice>
  <voice emotion="hopeful" rate="medium">
    But what if it didn't have to be a hostage negotiation? <break time="300ms"/>
  </voice>
  <voice emotion="excited" intensity="high" rate="fast">
    Enter <emphasis level="strong">Reward Speller</emphasis>! <break time="300ms"/>
  </voice>
  <voice emotion="enthusiastic" rate="medium">
    We replaced the dreary kitchen table with exceptional, immersive theming. <break time="200ms"/> 
    We swapped out that 1990s robotic dictation for ultra-realistic Text-To-Speech— 
  </voice>
  <voice emotion="sarcastic" pitch="low">
    because 'c-a-t' shouldn't sound like a dial-up modem. <break time="300ms"/>
  </voice>
  <voice emotion="excited" intensity="medium">
    Gamification keeps them engaged, and parent-sponsored rewards mean you finally have <break time="100ms"/> <emphasis level="moderate">leverage</emphasis>. <break time="400ms"/>
  </voice>
  <voice emotion="relieved" rate="slow">
    They learn, they earn, and you get to finish your coffee while it's still actually hot. <break time="500ms"/>
  </voice>
  <voice emotion="confident" intensity="high" pitch="high">
    <emphasis level="strong">Reward Speller</emphasis>. <break time="200ms"/> 
    Upgrade your spelling strategy today.
  </voice>
</speak>`;

const scenesConfig = [
  {
    id: 'scene1_hook',
    startFrame: 'scene1_hook_start',
    endFrame: 'scene1_hook_end',
    prompt: 'Morph smoothly from the dim lighting to bright warm lighting. Fast-motion sweep to clear the crumpled papers off the table, revealing the glowing tablet.',
  },
  {
    id: 'scene2_theming',
    startFrame: 'scene2_theming_start',
    endFrame: 'scene2_theming_end',
    prompt: 'Dynamically expand and morph the standard bedroom walls into a sci-fi space station. Keep the child perfectly still and focused on the tablet while the background transforms around them.',
  },
  {
    id: 'scene3_tts',
    startFrame: 'scene3_tts_start',
    endFrame: 'scene3_tts_end',
    prompt: 'Smoothly animate the digital guide character from a neutral expression to a natural smile. Ripple the glowing sound wave at the bottom of the screen smoothly in perfect sync with an audio beat.',
  },
  {
    id: 'scene4_gamification',
    startFrame: 'scene4_gamification_start',
    endFrame: 'scene4_gamification_end',
    prompt: 'Explode glowing digital confetti and golden coins outward from the tablet screen in a smooth slow-motion effect, dynamically lighting up the child\'s smiling face as they cheer.',
  },
  {
    id: 'scene5_rewards',
    startFrame: 'scene5_rewards_start',
    endFrame: 'scene5_rewards_end',
    prompt: 'The parent on the left taps their phone, sending a bright glowing digital spark across the split-screen line that instantly materializes the large toy box directly into the child\'s hands on the right.',
  },
  {
    id: 'scene6_outro',
    startFrame: 'scene6_outro_start',
    endFrame: 'scene6_outro_end',
    prompt: 'Smoothly extrude the flat text into 3D typography while rotating it slightly on its axis. Sweep a bright cinematic lens flare across the letters from left to right.',
  },
];

async function generateAudio() {
  const filename = 'commercial_voiceover.mp3';
  const filePath = path.join(outputDir, filename);

  console.log(`\n🎙️ [TTS SYNTHESIS] Generating Gemini TTS voiceover with emotion tags...`);

  if (isDryRun) {
    console.log(`[DRY RUN] Skipping live API call. SSML payload constructed successfully.`);
    fs.writeFileSync(filePath, `[DRY RUN MOCK AUDIO] SSML: ${ssmlVoiceover.slice(0, 50)}...`);
    return;
  }

  const config = {
    input: { ssml: ssmlVoiceover },
    voice: { languageCode: 'en-US', name: 'en-US-Neural2-D' },
    audioConfig: { audioEncoding: 'MP3' },
  };

  try {
    const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });

    const result = await response.json();

    if (result.error) {
      console.error(`❌ TTS API Error:`, result.error.message);
      console.warn(`⚠️ Fallback: Saving mock voiceover file for studio editing.`);
      fs.writeFileSync(filePath, `[MOCK AUDIO FALLBACK] SSML: ${ssmlVoiceover}`);
    } else if (result.audioContent) {
      fs.writeFileSync(filePath, Buffer.from(result.audioContent, 'base64'));
      console.log(`✅ Saved voiceover: ${filename}`);
    }
  } catch (err) {
    console.error(`💥 Network error generating audio:`, err.message);
    fs.writeFileSync(filePath, `[MOCK AUDIO FALLBACK] SSML: ${ssmlVoiceover}`);
  }
}

async function generateVeoVideos() {
  console.log(`\n🎞️ [VEO VIDEO INTERPOLATION] Constructing Veo API payloads for 6 scenes...`);

  const files = fs.readdirSync(artifactsDir);
  const studioBlueprint = { scenes: [] };

  for (const scene of scenesConfig) {
    const startImgFile = files.find(f => f.startsWith(scene.startFrame) && f.endsWith('.png'));
    const endImgFile = files.find(f => f.startsWith(scene.endFrame) && f.endsWith('.png'));

    if (!startImgFile || !endImgFile) {
      console.warn(`⚠️ Warning: Missing Start or End frame for ${scene.id}. Skipping Veo payload.`);
      continue;
    }

    console.log(`\n🎬 Scene: ${scene.id}`);
    console.log(`   Start Frame: ${startImgFile}`);
    console.log(`   End Frame:   ${endImgFile}`);
    console.log(`   Veo Prompt:  "${scene.prompt}"`);

    const startPath = path.join(artifactsDir, startImgFile);
    const endPath = path.join(artifactsDir, endImgFile);

    const startBase64 = fs.readFileSync(startPath, { encoding: 'base64' });
    const endBase64 = fs.readFileSync(endPath, { encoding: 'base64' });

    const veoPayload = {
      model: 'veo-1.0-turbo',
      input: {
        start_frame: { mime_type: 'image/png', data: startBase64 },
        end_frame: { mime_type: 'image/png', data: endBase64 },
        prompt: scene.prompt,
        aspect_ratio: '16:9',
        duration_seconds: scene.id === 'scene2_theming' || scene.id === 'scene3_tts' || scene.id === 'scene4_gamification' ? 10 : 5,
      },
    };

    studioBlueprint.scenes.push({
      id: scene.id,
      veo_payload: veoPayload,
    });

    const videoFilename = `${scene.id}.mp4`;
    const videoPath = path.join(outputDir, videoFilename);

    if (isDryRun) {
      console.log(`[DRY RUN] Veo video payload constructed successfully for ${scene.id}`);
      fs.writeFileSync(videoPath, `[DRY RUN MOCK VIDEO] Veo Prompt: ${scene.prompt}`);
      continue;
    }

    try {
      const response = await fetch(`https://us-central1-aiplatform.googleapis.com/v1/projects/secret-bloom-474313-m8/locations/us-central1/publishers/google/models/veo-1.0-turbo:predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(veoPayload),
      });

      const result = await response.json();

      if (result.error || !result.predictions) {
        console.warn(`⚠️ Veo API early-access quota missing or invalid token. Saving studio blueprint.`);
        fs.writeFileSync(videoPath, `[STUDIO BLUEPRINT FALLBACK] Veo Prompt: ${scene.prompt}`);
      } else {
        const videoContent = result.predictions[0].bytesBase64;
        fs.writeFileSync(videoPath, Buffer.from(videoContent, 'base64'));
        console.log(`✅ Saved video clip: ${videoFilename}`);
      }
    } catch (err) {
      console.error(`💥 Network error calling Veo for ${scene.id}:`, err.message);
      fs.writeFileSync(videoPath, `[STUDIO BLUEPRINT FALLBACK] Veo Prompt: ${scene.prompt}`);
    }
  }

  const blueprintPath = path.join(outputDir, 'veo_studio_blueprint.json');
  fs.writeFileSync(blueprintPath, JSON.stringify(studioBlueprint, null, 2));
  console.log(`\n📦 Saved complete Veo Studio Blueprint JSON to: commercial_output/veo_studio_blueprint.json`);
}

async function run() {
  console.log(`\n=================================================================`);
  console.log(`🚀 LAUNCHING COMMERCIAL MEDIA GENERATOR (Veo & Gemini TTS)`);
  console.log(`=================================================================\n`);

  await generateAudio();
  await generateVeoVideos();

  console.log(`\n🎉 COMMERCIAL MEDIA GENERATION PIPELINE COMPLETE!`);
  console.log(`All synthesized assets and studio blueprints are saved in: /commercial_output/\n`);
}

run();
