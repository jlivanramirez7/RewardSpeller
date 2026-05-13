import React, { useEffect, useState, useMemo } from 'react';
import { playStaticAudio, cancelTTS } from '../services/ttsService';
import { useAppContext } from '../context/AppContext';
import { createPortal } from 'react-dom';

/**
 * @component LessonModal
 * @description Educational overlay ("Jedi Archive") displaying lesson scripts, phonetic rules,
 * and vocabulary lists. Includes automatic TTS narration and visual text highlighting for phonic patterns.
 *
 * @param {Object} props
 * @param {Object} props.lessonData - Lesson metadata containing script text, theme, words list, and visual art.
 * @param {Function} props.onClose - Callback to close the modal and stop active audio narration.
 * @param {Function} props.onBeginTrials - Callback to transition the user directly into the game engine.
 * @returns {React.ReactElement} A React Portal rendering the modal over the document body.
 */
const LessonModal = ({ lessonData, onClose, onBeginTrials }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isEnlarged, setIsEnlarged] = useState(false); 
  const { markLessonListened } = useAppContext();

  // Autoplay prerequisite tracking: Mark lesson as listened upon modal view
  // to unlock corresponding game trial assessments.
  useEffect(() => {
    if (lessonData?.id) {
      markLessonListened(lessonData.id);
    }
    return () => cancelTTS(); 
  }, [lessonData, markLessonListened]);

  // Focus isolation lock: Disables document body overflow scrolling when the modal
  // is active to prevent background UI distractions during immersive audio-visual study.
  useEffect(() => {
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = originalStyle || '';
    };
  }, []);

  // AUTOPLAY: Trigger narration immediately on modal load
  useEffect(() => {
    if (lessonData?.id) {
      const filename = `lesson_${lessonData.id}.mp3`;
      playStaticAudio(
        filename,
        () => setIsPlaying(true),
        () => setIsPlaying(false),
        lessonData.lessonScript,
        'jedi'
      );
    }
  }, []);

  // Phonetic pattern extraction engine: Parses the active lesson theme string using
  // heuristic regex rules to isolate orthographic target clusters (IE, EE, Bossy R, Magic E).
  const getHighlightPatterns = (theme = "") => {
    const patterns = [];
    const t = theme.toUpperCase();
    if (t.includes("I BEFORE E")) patterns.push("ie", "ei");
    else if (t.includes("EE VOWEL")) patterns.push("ee");
    else if (t.includes("EA VOWEL")) patterns.push("ea");
    else if (t.includes("OU/OW")) patterns.push("ou", "ow");
    else if (t.includes("BOSSY R")) patterns.push("ar", "er", "ir", "or", "ur");
    else if (t.includes("MAGIC E")) patterns.push("e");
    else if (t.includes("ROOT") || t.includes("PREFIX") || t.includes("SUFFIX")) {
      const cleanStr = theme.split(':')[1] || "";
      const match = cleanStr.trim().split(/[,\s/]+/);
      if (match) patterns.push(...match.map(m => m.toLowerCase().replace(/^-+|-+$/g, '')).filter(Boolean));
    }
    return patterns;
  };

  const renderGlowingWord = (word) => {
    if (!word || typeof word !== 'string') return null;
    const list = getHighlightPatterns(lessonData.theme || "");
    if (!list.length) return word;
    
    const safeList = list
      .map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .sort((a, b) => b.length - a.length);

    if (lessonData.theme?.toUpperCase().includes("MAGIC E")) {
       if (word.toLowerCase().endsWith('e')) {
          return (
            <>
              {word.slice(0, -1)}
              <span style={glowSpanStyle}>{word.slice(-1)}</span>
            </>
          );
       }
       return word;
    }

    const regex = new RegExp(`(${safeList.join('|')})`, 'gi');
    const chunks = word.split(regex);

    return chunks.map((chunk, idx) => {
      const isMatch = list.some(p => p.toLowerCase() === chunk.toLowerCase());
      return isMatch ? (
        <span key={idx} style={glowSpanStyle}>{chunk}</span>
      ) : chunk;
    });
  };

  // Memoized categorization engine: Groups vocabulary words into distinct phonetic buckets.
  // Sorts active highlight patterns by descending length so that more specific,
  // longer phonetic patterns take matching priority over shorter sub-patterns.
  const groupedWords = useMemo(() => {
    const activePatterns = getHighlightPatterns(lessonData?.theme || "");
    const isMagicE = (lessonData?.theme || "").toUpperCase().includes("MAGIC E");
    
    const mapped = {};
    const sortedPatterns = [...activePatterns].sort((a, b) => b.length - a.length);
    sortedPatterns.forEach(p => mapped[p] = []);
    
    (lessonData?.words || []).forEach(item => {
      const w = (item?.word || "").toLowerCase();
      let bucket = 'general'; 

      if (isMagicE && w.endsWith('e')) {
        bucket = 'e';
      } else {
        const match = sortedPatterns.find(p => w.includes(p));
        if (match) bucket = match;
      }

      if (!mapped[bucket]) mapped[bucket] = [];
      mapped[bucket].push(item);
    });

    return mapped;
  }, [lessonData]);

  const toggleAudio = () => {
    if (isPlaying) {
      cancelTTS();
      setIsPlaying(false);
    } else {
      const filename = `lesson_${lessonData.id}.mp3`;
      playStaticAudio(
        filename,
        () => setIsPlaying(true),
        () => setIsPlaying(false),
        lessonData.lessonScript,
        'jedi'
      );
    }
  };

  const handleClose = () => {
    cancelTTS();
    onClose();
  };

  const handleBeginTrialsClick = () => {
    cancelTTS();
    if (onBeginTrials) {
      onBeginTrials(lessonData);
    }
  };

  const activePatternsList = getHighlightPatterns(lessonData?.theme || "");

  return createPortal(
    <>
      <div style={backdropStyles} onClick={handleClose}>
        <div className="glass-panel animate-pop-in" style={splitContainerStyles} onClick={(e) => e.stopPropagation()}>
          
          <button onClick={handleClose} style={closeIconStyles}>×</button>

          {/* NEW THEMATIC BANNER CROWNING TOP (Horizontal Layout) */}
          <div className="visual-banner" style={thematicBannerStyle}>
            {lessonData.imagePath && (
              <>
                <div style={{
                  ...ambientBgStyle,
                  backgroundImage: `url(${lessonData.imagePath})`
                }} />
                
                <div style={bannerFlexContentStyle}>
                   {/* Clickable Art Container bounded gracefully */}
                   <div 
                     style={miniArtFrameStyle}
                     onClick={() => setIsEnlarged(true)}
                     onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                     onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                   >
                     <img 
                       src={lessonData.imagePath} 
                       alt="Visual Asset"
                       style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '12px' }}
                     />
                   </div>
                   
                   {/* Dynamic Content Header overlaying the banner context */}
                   <div style={{ zIndex: 3, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#fbbf24', marginBottom: '4px' }}>
                         <span style={{ fontSize: '1.75rem' }}>🏛️</span>
                         <h2 style={{ fontSize: '1.75rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '2px', textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>Jedi Archive</h2>
                      </div>
                      <div style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.3)', padding: '0.5rem 1rem', borderRadius: '8px', width: 'fit-content' }}>
                        Active Subject: <strong style={{ color: 'white' }}>{lessonData.theme || lessonData.name}</strong>
                      </div>
                   </div>
                </div>
              </>
            )}
            <div style={{ ...visualBrandingStyle, zIndex: 4 }}>
              Holocron Live
            </div>
          </div>

          {/* EXPANDED MAIN WORKSPACE (Full Horizontal Area now scrollable) */}
          <div className="main-content-area" style={mainContentAreaStyle}>
            
            {/* Dynamic wider format script quote */}
            <div style={scriptBlockStyle}>
              "{lessonData.lessonScript}"
            </div>

            <h3 style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '1rem' }}>
              🎯 Structured Core Examples:
            </h3>
            
            <div className="infographic-grid" style={gridTableStyle}>
              <div style={gridHeaderStyle}>
                <div style={{ flex: 1 }}>VOCABULARY TERM</div>
                <div style={{ flex: 2.5 }}>PHONETIC CONTEXT & GLOSSARY DEFINITION</div>
              </div>

              {/* Explicitly iterating all words by logic groups within full expanded width */}
              {Object.entries(groupedWords).map(([bucket, words]) => {
                if (!words || words.length === 0) return null;
                
                const displayBucket = bucket === 'general' 
                  ? (activePatternsList.length > 0 ? "MISC REINFORCEMENT" : "FULL CURRICULUM LIST")
                  : `LOGIC GROUP: ${bucket.toUpperCase()}`;

                return (
                  <React.Fragment key={bucket}>
                    <div style={groupHeaderDividerStyle}>
                       {displayBucket}
                    </div>

                    {words.map((item, index) => (
                      <div key={index} style={gridRowStyle} className="educational-row-hover">
                         <div style={wordColStyle}>
                            {renderGlowingWord(item?.word?.toUpperCase())}
                         </div>
                         <div style={defColStyle}>
                            <div style={{ fontWeight: '700', color: '#fff', marginBottom: '4px', fontSize: '1rem' }}>{item?.definition}</div>
                            <div style={{ opacity: 0.65, fontStyle: 'italic', fontSize: '0.85rem', lineHeight: '1.4' }}>"{item?.sentence}"</div>
                         </div>
                      </div>
                    ))}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Optimized Footer alignment */}
          <div style={controlFooterStyle}>
             <button className="btn-secondary" onClick={toggleAudio} style={{ minWidth: '150px', padding: '1rem' }}>
               {isPlaying ? '🛑 STOP' : '🔊 NARRATE LESSON'}
             </button>
             <button className="btn-primary" onClick={handleBeginTrialsClick} style={{ flex: 1, fontWeight: '900', fontSize: '1.1rem', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', padding: '1rem' }}>
               BEGIN TRIALS →
             </button>
          </div>
        </div>
      </div>

      {/* FULLSCREEN LIGHTBOX OVERLAY */}
      {isEnlarged && (
        <div style={lightboxOverlayStyle} onClick={() => setIsEnlarged(false)}>
          <img 
            src={lessonData.imagePath} 
            alt="Expanded View" 
            style={lightboxImageStyle}
          />
          <div style={{ ...closeIconStyles, top: '2rem', right: '2rem', background: 'rgba(255,255,255,0.2)', zIndex: 10001 }}>×</div>
        </div>
      )}
    </>,
    document.body
  );
};

// 📐 REDESIGNED CANVASS DIMENSIONS
const backdropStyles = { position: 'fixed', inset: 0, background: 'rgba(10, 10, 20, 0.88)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 };
// Switched to flex column vertical stacking, expanded to 90vh and max-width 1200px for extreme density
const splitContainerStyles = { width: '95%', maxWidth: '1200px', height: '90vh', display: 'flex', flexDirection: 'column', background: 'linear-gradient(145deg, rgba(25, 33, 46, 0.95), rgba(15, 23, 42, 0.98))', overflow: 'hidden', position: 'relative', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 35px 60px -15px rgba(0,0,0,0.6)' };

// 🖼️ NEW BANNER REGION (Boosted Size)
const thematicBannerStyle = { position: 'relative', minHeight: '260px', flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 2.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', background: '#0a0f1c' };
const ambientBgStyle = { position: 'absolute', inset: '-10%', backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(35px) brightness(0.4)', opacity: 0.65, zIndex: 1 };
const bannerFlexContentStyle = { position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: '2.5rem', width: '100%' };
const miniArtFrameStyle = { width: '210px', height: '210px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '16px', padding: '0.5rem', boxShadow: '0 15px 25px rgba(0,0,0,0.4)', cursor: 'zoom-in', transition: 'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)', flexShrink: 0 };
const visualBrandingStyle = { position: 'absolute', top: '1.5rem', right: '4rem', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', padding: '0.4rem 0.8rem', borderRadius: '4px', fontSize: '0.6rem', letterSpacing: '1.5px', textTransform: 'uppercase', border: '1px solid #fbbf24', color: '#fbbf24', opacity: 0.8 };

// 📜 NEW SCROLLABLE WORKSPACE (Standard block flow ensures absolute scroll height calculation parity)
const mainContentAreaStyle = { flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', minHeight: 0, padding: '2rem 2.5rem' };

const scriptBlockStyle = { background: 'rgba(255, 255, 255, 0.03)', padding: '1.5rem', borderRadius: '16px', borderLeft: '6px solid #fbbf24', marginBottom: '2rem', fontStyle: 'italic', lineHeight: '1.6', fontSize: '1.05rem', color: 'rgba(255,255,255,0.92)', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.2)' };

// Enhanced Grid Rendering
const gridTableStyle = { display: 'flex', flexDirection: 'column', gap: '1px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' };
const gridHeaderStyle = { display: 'flex', background: 'rgba(255,255,255,0.03)', padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: '900', letterSpacing: '2px', color: 'rgba(255,255,255,0.5)' };
const gridRowStyle = { display: 'flex', background: 'rgba(0,0,0,0.15)', padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.02)', alignItems: 'center', transition: 'all 0.2s ease' };

const groupHeaderDividerStyle = { padding: '0.8rem 1.5rem', background: 'linear-gradient(90deg, rgba(251, 191, 36, 0.18), transparent)', borderLeft: '4px solid #fbbf24', color: '#fbbf24', fontSize: '0.8rem', fontWeight: '900', letterSpacing: '1.5px', textTransform: 'uppercase', textShadow: '0 0 8px rgba(251, 191, 36, 0.5)' };

const wordColStyle = { flex: 1, fontSize: '1.4rem', fontWeight: '800', letterSpacing: '1px', color: '#fff' };
const defColStyle = { flex: 2.5, fontSize: '0.95rem', color: 'rgba(255,255,255,0.85)' };

const controlFooterStyle = { display: 'flex', gap: '2rem', padding: '1.5rem 2.5rem', borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.15)', zIndex: 5, flexShrink: 0 };
const closeIconStyles = { position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'rgba(255,255,255,0.08)', border: 'none', color: 'white', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1.3rem', transition: '0.2s', zIndex: 50 };

const glowSpanStyle = { color: '#fbbf24', textShadow: '0 0 10px rgba(251, 191, 36, 0.9), 0 0 3px white', fontWeight: '900', background: 'rgba(251, 191, 36, 0.1)', padding: '0 2px', borderRadius: '2px' };

// Lightbox
const lightboxOverlayStyle = { position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(5, 8, 15, 0.95)', backdropFilter: 'blur(15px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out', padding: '3rem' };
const lightboxImageStyle = { maxWidth: '90%', maxHeight: '90%', objectFit: 'contain', borderRadius: '20px', boxShadow: '0 30px 80px rgba(0,0,0,0.95)', border: '1px solid rgba(255, 255, 255, 0.2)' };

export default LessonModal;
