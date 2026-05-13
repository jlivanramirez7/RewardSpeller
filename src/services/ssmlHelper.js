/**
 * @module ssmlHelper
 * @description Utility module for formatting plain text strings into Speech Synthesis Markup Language (SSML).
 * Manages XML character escaping, prosody pacing rates, and heuristic pause insertions.
 */

/**
 * Escapes special XML/HTML characters (&, <, >, ", ') to guarantee valid SSML structure.
 *
 * @param {string} text - Raw plain text string.
 * @returns {string} XML-escaped text string ready for SSML encapsulation.
 */
export function escapeSsml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Converts plain text into an SSML string wrapped with customized prosody pacing and pauses.
 * Injects dramatic pause breaks after commas when targeting 'jedi' voice profiles.
 *
 * @param {string} text - Raw text to format.
 * @param {string} [rate='slow'] - Speech rate identifier or percentage (e.g., '88%', '95%').
 * @param {string} [type='assessment'] - Voice type profile ('jedi' or 'assessment').
 * @returns {string} Fully formatted SSML `<speak>` payload.
 */
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
