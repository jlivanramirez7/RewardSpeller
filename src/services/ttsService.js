// Define single persistent Audio node to maintain browser permission state
let currentAudio = new Audio(); 
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

/* eslint-disable-next-line no-unused-vars */
export const playTTS = (text, _type = 'assessment', onStart, onEnd) => {
  cancelTTS();
  const sessionId = currentSessionId;

  const playNativeFallback = () => {
    console.log("Using native browser TTS fallback...");
    const utterance = new SpeechSynthesisUtterance(text);
    
    utterance.onstart = () => { if (currentSessionId === sessionId && onStart) onStart(); };
    utterance.onend = () => { if (currentSessionId === sessionId && onEnd) onEnd(); };
    utterance.onerror = () => { if (currentSessionId === sessionId && onEnd) onEnd(); };
    
    window.speechSynthesis.speak(utterance);
  };

  if (currentSessionId === sessionId) {
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
  
  currentAudio.onerror = () => {
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

  currentAudio.play().catch(() => {
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
