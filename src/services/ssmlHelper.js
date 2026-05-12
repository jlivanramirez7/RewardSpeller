export function escapeSsml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function convertTextToSsml(text, rate = 'slow', type = 'assessment') {
  if (!text) return '';
  const escaped = escapeSsml(text);
  
  let processedText = escaped;
  if (type === 'jedi') {
    // Add extra pauses after commas for dramatic effect
    processedText = processedText.replace(/,\s+/g, ', <break time="300ms"/> ');
  }
  
  // Add breaks after sentences (periods, question marks, or exclamation points followed by one or more spaces)
  // Note: This is a simple heuristic and may cause false positives on abbreviations (e.g., "Mr. Smith").
  const withBreaks = processedText.replace(/([.!?])\s+/g, '$1 <break time="500ms"/> ');
  
  return `<speak><prosody rate="${rate}">${withBreaks.trim()}</prosody></speak>`;
}
