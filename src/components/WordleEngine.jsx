import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useAppContext } from '../context/AppContext';
import { playStaticAudio, cancelTTS } from '../services/ttsService';
import { getDailyWord, getWordleDateKey, calculateWordleScore, evaluateGuess } from '../utils/wordle';

/**
 * @component WordleEngine
 * @description Interactive daily 5-letter spelling Wordle workspace.
 *
 * @param {Object} props
 * @param {Function} props.onClose - Callback triggered to close the modal.
 * @returns {React.ReactElement} The Spellerle workspace modal.
 */
const WordleEngine = ({ onClose }) => {
  const { tiers, wordleScores, addWordlePoints } = useAppContext();
  const [targetWordObj, setTargetWordObj] = useState(null);
  
  const [guesses, setGuesses] = useState([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [gameStatus, setGameStatus] = useState('playing'); // 'playing', 'won', 'lost'
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [pointsEarned, setPointsEarned] = useState(0);
  
  const [shakeRowIndex, setShakeRowIndex] = useState(-1);
  const [errorMessage, setErrorMessage] = useState('');

  const timerRef = useRef(null);
  const dateKey = useMemo(() => getWordleDateKey(), []);

  // Initialize the Daily Word
  useEffect(() => {
    const wordObj = getDailyWord(tiers, dateKey);
    setTargetWordObj(wordObj);

    if (wordObj && wordleScores && wordleScores[dateKey] !== undefined) {
      setGameStatus('already_played');
      setPointsEarned(wordleScores[dateKey]);
    }
  }, [tiers, dateKey, wordleScores]);

  // Game Timer Interval
  useEffect(() => {
    if (gameStatus === 'playing' && targetWordObj) {
      timerRef.current = setInterval(() => {
        setSecondsElapsed(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameStatus, targetWordObj]);

  const speakEndGame = useCallback((wordObj) => {
    if (!wordObj) return;
    const textToSpeak = `${wordObj.word}. ${wordObj.definition || ''} ${wordObj.sentence || ''} The word is: ${wordObj.word}.`;
    const safeWord = wordObj.word.toLowerCase().replace(/[^a-z0-9]/g, '');
    // Pattern matched filename: word_g4_t1_s1_receipt.mp3
    const filename = `word_${wordObj.sectionId}_${safeWord}.mp3`;

    console.log(`[SPELLERLE TTS] Playing audio for target word: ${wordObj.word}`);
    playStaticAudio(filename, null, null, textToSpeak, 'assessment');
  }, []);

  const handleKeyPress = (key) => {
    if (gameStatus !== 'playing') return;
    setErrorMessage('');

    if (key === 'Enter') {
      if (currentGuess.length !== 5) {
        setErrorMessage('Word must be 5 letters long.');
        setShakeRowIndex(guesses.length);
        setTimeout(() => setShakeRowIndex(-1), 500);
        return;
      }

      const newGuesses = [...guesses, currentGuess.toLowerCase()];
      setGuesses(newGuesses);
      setCurrentGuess('');

      const isWon = currentGuess.toLowerCase() === targetWordObj.word.toLowerCase();
      const isLost = !isWon && newGuesses.length >= 6;

      if (isWon || isLost) {
        const status = isWon ? 'won' : 'lost';
        setGameStatus(status);
        
        const score = calculateWordleScore(newGuesses.length, secondsElapsed, isWon);
        setPointsEarned(score);
        
        // Save Points to Isolated Ledger
        addWordlePoints(dateKey, score);
        
        // Fire End-Game TTS Pipeline
        setTimeout(() => {
          speakEndGame(targetWordObj);
        }, 800);
      }
    } else if (key === 'Backspace') {
      setCurrentGuess(prev => prev.slice(0, -1));
    } else if (/^[a-zA-Z]$/.test(key)) {
      if (currentGuess.length < 5) {
        setCurrentGuess(prev => prev + key.toUpperCase());
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter' || e.key === 'Backspace' || /^[a-zA-Z]$/.test(e.key)) {
        handleKeyPress(e.key);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      cancelTTS();
    };
  }, [currentGuess, gameStatus, guesses, targetWordObj, secondsElapsed]);

  if (!targetWordObj) {
    return createPortal(
      <div className="lightbox-overlay" onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(5, 8, 15, 0.95)', backdropFilter: 'blur(15px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: '3rem' }}>
        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'white' }}>
          <p>No 5-letter words found in your active curriculum for today's puzzle.</p>
          <button className="btn-primary" onClick={onClose} style={{ marginTop: '1rem' }}>Close</button>
        </div>
      </div>,
      document.body
    );
  }

  // Keyboard and Color Matrix Mappings
  const keyColors = {};
  guesses.forEach((guess) => {
    const matrix = evaluateGuess(guess, targetWordObj.word);
    for (let i = 0; i < 5; i++) {
      const letter = guess[i].toUpperCase();
      const status = matrix[i];
      if (status === 'correct') {
        keyColors[letter] = '#10b981'; // Green
      } else if (status === 'present' && keyColors[letter] !== '#10b981') {
        keyColors[letter] = '#fbbf24'; // Yellow
      } else if (status === 'absent' && !keyColors[letter]) {
        keyColors[letter] = '#475569'; // Slate/Grey
      }
    }
  });

  const KEYBOARD_ROWS = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Enter', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'Backspace']
  ];

  return createPortal(
    <div className="lightbox-overlay" style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(5, 8, 15, 0.95)', backdropFilter: 'blur(15px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem' }}>
      <div className="animate-scale-up" style={{ 
        display: 'flex', 
        gap: '2rem', 
        maxWidth: '1100px', 
        width: '95%', 
        margin: '3vh auto',
        flexWrap: 'wrap',
        alignItems: 'flex-start',
        maxHeight: '94vh',
        overflowY: 'auto',
        padding: '1rem'
      }}>

        {/* LEFT COLUMN: GAME ENGINE & KEYBOARD */}
        <div className="glass-panel" style={{ flex: '2 1 500px', padding: '2rem', textAlign: 'center', background: 'rgba(30, 41, 59, 0.75)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
             <button className="btn-secondary" onClick={onClose}>← Back to Portal</button>
             <div style={{ 
               background: 'rgba(0,0,0,0.3)', 
               padding: '0.5rem 1rem', 
               borderRadius: '8px', 
               border: '1px solid var(--surface-border)', 
               fontWeight: 'bold', 
               color: '#fbbf24', 
               fontSize: '1.1rem' 
             }}>
               ⏱️ {Math.floor(secondsElapsed / 60)}:{String(secondsElapsed % 60).padStart(2, '0')}
             </div>
          </div>

          <h2 style={{ color: 'white', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Daily Spellerle</h2>

          {/* 5x6 GRID */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', marginBottom: '2rem' }}>
            {Array(6).fill(null).map((_, rowIndex) => {
              const isCurrentRow = rowIndex === guesses.length;
              const isPastRow = rowIndex < guesses.length;
              let rowText = '';
              let matrix = Array(5).fill('default');

              if (isPastRow) {
                rowText = guesses[rowIndex];
                matrix = evaluateGuess(rowText, targetWordObj.word);
              } else if (isCurrentRow) {
                rowText = currentGuess.padEnd(5, ' ');
              } else {
                rowText = '     ';
              }

              return (
                <div 
                  key={rowIndex} 
                  className={shakeRowIndex === rowIndex ? "animate-shake" : ""}
                  style={{ display: 'flex', gap: '8px' }}
                >
                  {Array(5).fill(null).map((_, colIndex) => {
                    const char = rowText[colIndex]?.trim() || '';
                    const status = matrix[colIndex];
                    
                    let bg = 'rgba(0,0,0,0.3)';
                    let border = '1px solid rgba(255, 255, 255, 0.2)';
                    
                    if (isPastRow) {
                      if (status === 'correct') {
                        bg = '#10b981';
                        border = '1px solid #10b981';
                      } else if (status === 'present') {
                        bg = '#fbbf24';
                        border = '1px solid #fbbf24';
                      } else if (status === 'absent') {
                        bg = '#475569';
                        border = '1px solid #475569';
                      }
                    } else if (isCurrentRow && char) {
                      border = '1px solid var(--accent-cyan)';
                    }

                    return (
                      <div key={colIndex} style={{
                        width: '50px',
                        height: '50px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        color: 'white',
                        background: bg,
                        border: border,
                        borderRadius: '6px',
                        textTransform: 'uppercase',
                        transition: 'all 0.3s'
                      }}>
                        {char}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {errorMessage && (
            <div style={{ color: '#ef4444', fontWeight: 'bold', marginBottom: '1rem', fontSize: '0.9rem' }}>
               ⚠️ {errorMessage}
            </div>
          )}

          {/* KEYBOARD */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
            {KEYBOARD_ROWS.map((row, rIdx) => (
              <div key={rIdx} style={{ display: 'flex', gap: '6px' }}>
                {row.map((key) => {
                  const bg = keyColors[key] || 'rgba(255,255,255,0.1)';
                  const isLarge = key === 'Enter' || key === 'Backspace';
                  return (
                    <button
                      key={key}
                      onClick={() => handleKeyPress(key)}
                      style={{
                        padding: '0',
                        width: isLarge ? '65px' : '40px',
                        height: '45px',
                        background: bg,
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontWeight: 'bold',
                        fontSize: isLarge ? '0.8rem' : '1.1rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background 0.2s'
                      }}
                    >
                      {key === 'Backspace' ? '⌫' : key}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* END GAME PANEL */}
          {gameStatus !== 'playing' && (
            <div className="animate-fade-in" style={{ 
              marginTop: '2rem', 
              padding: '1.5rem', 
              background: 'rgba(0,0,0,0.3)', 
              borderRadius: '12px',
              border: '2px solid',
              borderColor: gameStatus === 'won' || gameStatus === 'already_played' ? '#10b981' : '#ef4444'
            }}>
              <h3 style={{ color: 'white', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                {gameStatus === 'won' ? '🎉 YOU GUESSED IT!' : (gameStatus === 'already_played' ? '🏆 Daily Puzzle Completed!' : '❌ NICE TRY!')}
              </h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                The word was: <strong style={{ color: 'white', textTransform: 'uppercase' }}>{targetWordObj.word}</strong>
              </p>
              <p style={{ color: '#fbbf24', fontWeight: 'bold', fontSize: '1.25rem' }}>
                + {pointsEarned} Wordle Points Earned
              </p>
              <button 
                className="btn-secondary" 
                style={{ marginTop: '1rem' }}
                onClick={() => speakEndGame(targetWordObj)}
              >
                🔊 Hear Word & Definition Again
              </button>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: INSTRUCTION CARD */}
        <div className="glass-panel" style={{ flex: '1 1 300px', padding: '1.5rem', background: 'rgba(251, 191, 36, 0.05)', border: '1px solid #fbbf24', borderLeft: '4px solid #fbbf24' }}>
          <h3 style={{ color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '1.1rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            <span>💡 How to Play Spellerle</span>
          </h3>
          <ul style={{ color: 'var(--text-secondary)', paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem', lineHeight: '1.5' }}>
            <li>Guess the **5-letter word** from today's curriculum in 6 attempts!</li>
            <li>Each guess must be a valid 5-letter word. Press the Enter button to submit.</li>
            <li>
               <strong style={{ color: '#10b981' }}>Green</strong>: Letter is in the word and in the correct spot.
            </li>
            <li>
               <strong style={{ color: '#fbbf24' }}>Yellow</strong>: Letter is in the word but in the wrong spot.
            </li>
            <li>
               <strong style={{ color: '#94a3b8' }}>Grey</strong>: Letter is not in the word in any spot.
            </li>
          </ul>

          <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px dashed rgba(251, 191, 36, 0.3)' }}>
            <h4 style={{ color: 'white', fontSize: '0.95rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>🏆 Scoring Formulation</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.5' }}>
              Wordle Points are awarded based on both your speed (Timer) and how few attempts you use. 
            </p>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '8px', marginTop: '0.75rem', fontSize: '0.85rem', color: 'white', border: '1px solid rgba(255,255,255,0.05)' }}>
               ⭐ <strong>Formula:</strong> ((7 - Attempts) × 100) + (Remaining Time bonus out of 300 secs)
            </div>
            <p style={{ color: '#a855f7', fontSize: '0.8rem', fontWeight: 'bold', marginTop: '1rem', lineHeight: '1.4' }}>
               🎁 <strong>FOR FUN ONLY:</strong> Wordle points boost your rank on the Daily Wordle Leaderboard, but DO NOT subtract from or count toward your Parent Rewards Vault!
            </p>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
};

export default WordleEngine;
