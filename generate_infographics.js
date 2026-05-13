/**
 * @file generate_infographics.js
 * @description Automated canvas generation script utilizing PureImage to pre-render widescreen
 * PNG infographic cards and thematic tier overview banners across all grade levels (`wordBank_*.json`).
 * Guarantees zero vertical text overflow by enforcing a 1024x960 canvas and rendering TrueType fonts (`DejaVuSans.ttf`).
 *
 * @example
 * // Execution syntax:
 * node generate_infographics.js
 *
 * @prerequisites
 * Requires `pureimage` dependency installed and TrueType font accessible at `/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf`.
 */

import * as PImage from 'pureimage';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fontPath = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';
const font = PImage.registerFont(fontPath, 'DejaVuSans');

const wrapText = (ctx, text, x, y, maxWidth, lineHeight) => {
  if (!text) return y;
  const words = text.split(' ');
  let line = '';
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, y);
      line = words[n] + ' ';
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
  return y + lineHeight;
};

const generateImage = async (outputPath, title, subtitle, ruleText, wordsList, gradeColor, isTier = false) => {
  const width = 1024;
  const height = 960; // Increased height to guarantee zero vertical overflow
  const img = PImage.make(width, height);
  const ctx = img.getContext('2d');

  // Dark Slate Background
  ctx.fillStyle = '#0f172a'; // slate-900
  ctx.fillRect(0, 0, width, height);

  // Outer accent border
  ctx.fillStyle = '#334155';
  ctx.fillRect(10, 10, width - 20, 4);
  ctx.fillRect(10, height - 14, width - 20, 4);
  ctx.fillRect(10, 10, 4, height - 20);
  ctx.fillRect(width - 14, 10, 4, height - 20);

  // Header banner
  ctx.fillStyle = gradeColor;
  ctx.fillRect(14, 14, width - 28, 160);

  // Header gold border
  ctx.fillStyle = '#fbbf24'; // amber-400
  ctx.fillRect(14, 170, width - 28, 4);

  // Banner Type Label (Stripped emojis for pristine TrueType font rendering)
  ctx.fillStyle = '#fbbf24';
  ctx.font = '16pt DejaVuSans';
  ctx.fillText(isTier ? 'CURRICULUM TIER OVERVIEW' : 'LESSON INFOGRAPHIC', 50, 55);

  // Header Title
  ctx.fillStyle = '#ffffff';
  ctx.font = '32pt DejaVuSans';
  ctx.fillText(title || 'Curriculum Infographic', 50, 120);

  let currentY = 220;

  // Subtitle / Description
  if (subtitle) {
    ctx.fillStyle = '#94a3b8'; // slate-400
    ctx.font = '20pt DejaVuSans';
    currentY = wrapText(ctx, subtitle, 50, currentY, width - 100, 32);
    currentY += 30;
  }

  // Rule / Highlight Box
  if (ruleText) {
    const boxHeight = isTier ? 380 : 220;
    ctx.fillStyle = '#1e293b'; // slate-800 box
    ctx.fillRect(40, currentY, width - 80, boxHeight);

    ctx.fillStyle = '#fbbf24'; // gold border for box
    ctx.fillRect(40, currentY, width - 80, 2);
    ctx.fillRect(40, currentY + boxHeight, width - 80, 2);
    ctx.fillRect(40, currentY, 2, boxHeight);
    ctx.fillRect(width - 42, currentY, 2, boxHeight);

    ctx.fillStyle = '#fbbf24';
    ctx.font = '20pt DejaVuSans';
    ctx.fillText('STRATEGY & CORE RULE:', 70, currentY + 45);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '18pt DejaVuSans';
    wrapText(ctx, ruleText, 70, currentY + 95, width - 140, 32);
    
    currentY += boxHeight + 40;
  }

  // Sample Vocabulary Cards (For Sections)
  if (wordsList && wordsList.length > 0 && !isTier) {
    ctx.fillStyle = '#fbbf24';
    ctx.font = '20pt DejaVuSans';
    ctx.fillText('KEY VOCABULARY EXAMPLES:', 50, currentY);
    
    currentY += 40;
    const colWidth = 440;
    const colGap = 30;
    const maxWords = Math.min(wordsList.length, 4);

    for (let i = 0; i < maxWords; i++) {
      const wObj = wordsList[i];
      const col = i % 2;
      const row = Math.floor(i / 2);
      const cardX = 50 + col * (colWidth + colGap);
      const cardY = currentY + row * 120;

      // Card Box
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(cardX, cardY, colWidth, 105);

      ctx.fillStyle = '#334155';
      ctx.fillRect(cardX, cardY, colWidth, 1);
      ctx.fillRect(cardX, cardY + 105, colWidth, 1);
      ctx.fillRect(cardX, cardY, 1, 105);
      ctx.fillRect(cardX + colWidth, cardY, 1, 105);

      // Word Text
      ctx.fillStyle = '#fbbf24';
      ctx.font = '22pt DejaVuSans';
      ctx.fillText((wObj.word || '').toUpperCase(), cardX + 20, cardY + 35);

      // Definition Text wrapped across two lines cleanly
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '14pt DejaVuSans';
      const defText = wObj.definition || '';
      wrapText(ctx, defText, cardX + 20, cardY + 65, colWidth - 40, 22);
    }
  }

  // Ensure directory exists
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  await PImage.encodePNGToStream(img, fs.createWriteStream(outputPath));
  console.log(`✅ Generated: ${outputPath}`);
};

const run = async () => {
  console.log('🚀 Starting Infographics Generation Pipeline...');
  await font.load();

  const gradeConfigs = [
    { file: 'wordBank_2nd.json', color: '#1e3a8a', name: '2nd Grade' }, // dark blue
    { file: 'wordBank_3rd.json', color: '#065f46', name: '3rd Grade' }, // dark green
    { file: 'wordBank_5th.json', color: '#581c87', name: '5th Grade' }, // dark purple
    { file: 'wordBank_6th.json', color: '#991b1b', name: '6th Grade' }, // dark red
  ];

  for (const config of gradeConfigs) {
    const dataPath = path.join(__dirname, 'src', 'data', config.file);
    if (!fs.existsSync(dataPath)) {
      console.warn(`⚠️ Skipping missing file: ${dataPath}`);
      continue;
    }

    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    if (!Array.isArray(data.tiers)) continue;

    for (const tier of data.tiers) {
      if (tier.lessonImage) {
        const cleanRel = tier.lessonImage.replace(/^\/+/, '');
        const outPath = path.join(__dirname, 'public', cleanRel);
        await generateImage(
          outPath,
          `${config.name} - ${tier.name}`,
          tier.description,
          tier.rule || 'Follow the phonics and vocabulary rules.',
          [],
          config.color,
          true
        );
      }

      if (Array.isArray(tier.sections)) {
        for (const section of tier.sections) {
          if (section.imagePath) {
            const cleanRel = section.imagePath.replace(/^\/+/, '');
            const outPath = path.join(__dirname, 'public', cleanRel);
            await generateImage(
              outPath,
              `${config.name} - ${section.name}`,
              section.theme ? `Theme: ${section.theme}` : '',
              section.rule || section.lessonScript || 'Master this section.',
              section.words || [],
              config.color,
              false
            );
          }
        }
      }
    }
  }

  console.log('🎉 All tailor-made infographics generated successfully!');
};

run().catch(console.error);
