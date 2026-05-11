let currentAudio = null;
const audioCache = new Map(); // In-memory cache to prevent redundant API calls
let currentSessionId = 0; // Tracks the active audio session to prevent async overlaps

export const cancelTTS = () => {
  window.speechSynthesis.cancel(); // Stop native fallback if it's playing
  currentSessionId++; // Invalidate any pending async fetches
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
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

  const cacheKey = `${type}_${text}`;
  
  const playBase64Audio = (base64String) => {
    currentAudio = new Audio(`data:audio/mp3;base64,${base64String}`);
    currentAudio.onplay = () => { if (onStart) onStart(); };
    currentAudio.onended = () => {
      if (onEnd) onEnd();
      currentAudio = null;
    };
    currentAudio.onerror = () => {
      console.error("Audio playback error");
      playNativeFallback();
      currentAudio = null;
    };
    currentAudio.play().catch(err => {
      console.warn("Audio playback prevented by browser:", err);
      playNativeFallback();
    });
  };

  if (audioCache.has(cacheKey)) {
    console.log("Playing audio from cache to save API calls!");
    playBase64Audio(audioCache.get(cacheKey));
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

    if (currentSessionId !== sessionId) return;

    const data = await response.json();
    if (data.audioContent) {
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
