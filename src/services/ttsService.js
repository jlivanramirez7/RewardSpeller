import { convertTextToSsml } from './ssmlHelper.js';

// Define single persistent Audio node to maintain browser permission state
let currentAudio = new Audio(); 
const audioCache = new Map(); // In-memory cache to prevent redundant API calls
let currentSessionId = 0; // Tracks the active audio session to prevent async overlaps

// WARMUP Hook: Call synchronously inside User Click handler to secure transient activation context
export const warmupAudio = () => {
  console.log("🔓 Warming up global audio context from user gesture...");
  // Play a microscopic, silent 1-sample wav placeholder to establish "blessed" playback state
  currentAudio.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAP8A";
  currentAudio.play().catch(() => {}); // Fire and forget silent init
};

export const cancelTTS = () => {
  window.speechSynthesis.cancel(); // Stop native fallback if it's playing
  currentSessionId++; // Invalidate any pending async fetches
  if (currentAudio) {
    currentAudio.pause();
    // Clear out handlers to prevent collision on re-use
    currentAudio.onplay = null;
    currentAudio.onended = null;
    currentAudio.onerror = null;
    currentAudio.src = ""; // Wipe current data without destroying node
  }
};

export const playTTS = async (text, type = 'assessment', onStart, onEnd) => {
  cancelTTS();
  const sessionId = currentSessionId;
  const apiKey = import.meta.env.VITE_GOOGLE_TTS_API_KEY;

  const playNativeFallback = () => {
    console.log("Using native browser TTS fallback...");
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Do absolutely no voice selection, pitch, or rate shifting.
    // Let the browser use its safest, default system voice.
    utterance.onstart = () => { if (onStart) onStart(); };
    utterance.onend = () => { if (onEnd) onEnd(); };
    utterance.onerror = () => { if (onEnd) onEnd(); };
    
    window.speechSynthesis.speak(utterance);
  };

  if (!apiKey) {
    console.error("Google TTS API Key is missing. Falling back to native.");
    if (currentSessionId === sessionId) playNativeFallback();
    return;
  }

  let voiceName = 'en-US-Neural2-D'; // Switched to Neural2 for SSML support
  let ssmlRate = '95%';

  if (type === 'jedi') {
    ssmlRate = '88%'; 
  } else if (type === 'assessment') {
    ssmlRate = '95%';
  }

  const cacheKey = `${type}_${text}`;
  
  const playBase64Audio = (base64String) => {
    // REUSE singleton element so browser honors previous user interaction context
    currentAudio.src = `data:audio/mp3;base64,${base64String}`;
    currentAudio.onplay = () => { if (onStart) onStart(); };
    currentAudio.onended = () => {
      if (onEnd) onEnd();
    };
    currentAudio.onerror = () => {
      console.error("Audio playback error");
      playNativeFallback();
    };
    currentAudio.play().catch(err => {
      console.warn("Audio playback prevented by browser despite base64 wrapper:", err);
      playNativeFallback();
    });
  };

  if (audioCache.has(cacheKey)) {
    console.log("Playing audio from cache to save API calls!");
    playBase64Audio(audioCache.get(cacheKey));
    return;
  }

  try {
    // DYNAMIC AUTH ROUTING: Seamlessly detect standard Keys vs modern Bearer Tokens
    const isBearerToken = apiKey.startsWith('ya29.') || apiKey.startsWith('AQ.') || apiKey.length > 50;
    
    const baseUrl = `https://texttospeech.googleapis.com/v1/text:synthesize`;
    const fetchUrl = isBearerToken ? baseUrl : `${baseUrl}?key=${apiKey}`;
    
    const fetchHeaders = { 
      'Content-Type': 'application/json'
    };
    if (isBearerToken) {
      fetchHeaders['Authorization'] = `Bearer ${apiKey}`;
      fetchHeaders['x-goog-user-project'] = 'secret-bloom-474313-m8'; // Explicit override solely for Bearer context
    }

    const response = await fetch(fetchUrl, {
      method: 'POST',
      headers: fetchHeaders,
      body: JSON.stringify({
        input: { 
          ssml: convertTextToSsml(text, ssmlRate, type)
        },
        voice: { 
          languageCode: 'en-US', 
          name: voiceName
        },
        audioConfig: { audioEncoding: 'MP3' },
      })
    });

    if (currentSessionId !== sessionId) return;

    const data = await response.json();
    if (data.audioContent) {
      // CAPPED CACHE: Prevent heap leakage on ultra-long sessions
      if (audioCache.size > 50) audioCache.clear();
      audioCache.set(cacheKey, data.audioContent); // Save to cache
      if (currentSessionId === sessionId) playBase64Audio(data.audioContent);
    } else {
      console.error("TTS API Error (Falling back to native):", data);
      if (currentSessionId === sessionId) playNativeFallback();
    }
  } catch (error) {
    if (currentSessionId !== sessionId) return;
    console.error("Failed to fetch TTS (Falling back to native):", error);
    playNativeFallback();
  }
};

// NEW Static Audio Dispatcher with failover resilience
export const playStaticAudio = (filename, onStart, onEnd, fallbackText, fallbackType = 'assessment') => {
  cancelTTS();
  const sessionId = currentSessionId;
  
  const audioPath = `/assets/audio/${filename}`;
  
  // REUSE singleton element
  currentAudio.src = audioPath;
  
  currentAudio.onplay = () => { 
    if (onStart) onStart(); 
  };
  
  currentAudio.onended = () => {
    if (onEnd) onEnd();
  };
  
  currentAudio.onerror = (e) => {
    console.warn(`⚠️ Static Audio resource unreadable at ${audioPath}. Reverting to dynamic engine...`);
    // CRITICAL FIX: NEVER NULLIFY THE SINGLETON OR BROWSER ACTIVATION STATE IS LOST!
    // ACTIVATE DYNAMIC FAILOVER ONLY IF SAME SESSION
    if (currentSessionId === sessionId) {
      if (fallbackText) {
         playTTS(fallbackText, fallbackType, onStart, onEnd);
      } else if (onEnd) {
         onEnd();
      }
    }
  };

  currentAudio.play().catch(err => {
    console.warn("Autoplay policy blocked direct init. Attempting seamless dynamic fallback.");
    if (currentSessionId === sessionId) {
      if (fallbackText) {
         playTTS(fallbackText, fallbackType, onStart, onEnd);
      } else if (onEnd) {
         onEnd();
      }
    }
  });
};
