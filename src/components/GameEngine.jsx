import { useState, useEffect, useRef, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { playStaticAudio, cancelTTS } from '../services/ttsService';
import { calculateFinalSessionScore, DIFFICULTY_POINTS } from '../utils/scoring';

const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * @component GameEngine
 * @description Interactive spelling assessment workspace. Manages word dictation via Text-to-Speech (TTS),
 * validates student spelling inputs, maintains session scores with streak multiplier bonuses, and handles
 * progression across Easy (Copy), Medium (Recall), and Hard (Dictate) difficulty tiers.
 *
 * @param {Object} props
 * @param {string|number} props.tierId - Identifier of the parent curriculum tier.
 * @param {Object} props.section - Active section object containing vocabulary words, definitions, and sentences.
 * @param {Function} props.onComplete - Callback triggered when the user completes or masters the section.
 * @param {string} props.tierRule - Educational spelling rule displayed as a hint to the student.
 * @param {string} [props.initialDifficulty='easy'] - Starting difficulty mode.
 * @returns {React.ReactElement} The interactive spelling workspace UI.
 */
const GameEngine = ({ tierId, section, onComplete, tierRule, initialDifficulty = 'easy' }) => {
  const { setStudentStreak, studentStreak, addStruggleWord, updateSectionScore, isDifficultyUnlocked, rewards, studentPoints, sectionScores } = useAppContext();
  
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [difficulty, setDifficulty] = useState(initialDifficulty); // easy, medium, hard
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: string }
  const [showWord, setShowWord] = useState(true);
  const [sessionScore, setSessionScore] = useState(0);
  const [sessionCorrectCount, setSessionCorrectCount] = useState(0);
  const [isSessionComplete, setIsSessionComplete] = useState(false);
  const [completionData, setCompletionData] = useState(null);
  const [hasFailedCurrentWord, setHasFailedCurrentWord] = useState(false);
  
  const inputRef = useRef(null);
  // Lifecycle guard tracking component unmount to block trailing async state updates
  const isMountedRef = useRef(true); 
  const advanceTimeoutRef = useRef(null);
  // Concurrency lock blocking rapid multiple submissions during animation transition delays
  const isProcessingRef = useRef(false);
  
  const [shuffledWords, setShuffledWords] = useState(() => 
    section?.words ? shuffleArray(section.words) : []
  );



  // The word list for the current section
  const words = shuffledWords;
  const currentWordObj = words[currentWordIndex];
  const currentWord = currentWordObj?.word || '';



  // Text-to-Speech
  const speakWord = useCallback(() => {
    if (!currentWordObj) return;
    const textToSpeak = `${currentWord}. ${currentWordObj.definition || ''} ${currentWordObj.sentence || ''} The word is: ${currentWord}.`;
    // Pattern matched filename: word_apple.mp3
    const safeWord = currentWord.toLowerCase().replace(/[^a-z0-9]/g, '');
    const filename = `word_${section.id}_${safeWord}.mp3`;

    // Dual-path dispatch: attempts local static playback, failovers automatically if absent.
    playStaticAudio(filename, null, null, textToSpeak, 'assessment');
  }, [currentWordObj, currentWord, section.id]);

  // Cleanup TTS on unmount and mark unmounted
  // Lifecycle cleanup guard: Ensures component unmount cancels pending TTS audio
  // and blocks trailing setTimeout state transitions to prevent memory leaks.
  useEffect(() => {
    isMountedRef.current = true; // RESTORE mounted state explicitly on mount/remount
    return () => {
      isMountedRef.current = false; // Block trailing timeouts
      cancelTTS();
      if (advanceTimeoutRef.current) {
        clearTimeout(advanceTimeoutRef.current);
      }
    };
  }, []);

  const startNewWord = useCallback(() => {
    setUserInput('');
    setFeedback(null);
    setHasFailedCurrentWord(false);
    speakWord();
    
    if (difficulty === 'easy' || difficulty === 'medium') {
      setShowWord(true);
    } else {
      setShowWord(false);
    }
    
    setTimeout(() => {
      if (isMountedRef.current && inputRef.current) inputRef.current.focus();
    }, 50);
  }, [difficulty, speakWord]);

  useEffect(() => {
    if (words.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      startNewWord();
    }
  }, [startNewWord, words, currentWordIndex]);

  const handleDifficultyChange = (e) => {
    setDifficulty(e.target.value);
    setSessionScore(0);
    setSessionCorrectCount(0);
    setCurrentWordIndex(0);
    if (section?.words) {
      setShuffledWords(shuffleArray(section.words));
    }
    if (advanceTimeoutRef.current) {
      clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = null;
    }
    isProcessingRef.current = false;
  };

  const handleRetry = () => {
    setIsSessionComplete(false);
    setCompletionData(null);
    setCurrentWordIndex(0);
    setSessionScore(0);
    setSessionCorrectCount(0);
    setStudentStreak(0);
    setFeedback(null);
    if (section?.words) {
      setShuffledWords(shuffleArray(section.words));
    }
    if (advanceTimeoutRef.current) {
      clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = null;
    }
    isProcessingRef.current = false;
  };

  const checkSpelling = (e) => {
    e.preventDefault();
    if (!userInput.trim() || feedback || isProcessingRef.current) return; // BLOCK if processing
    
    isProcessingRef.current = true;

    const isCorrect = userInput.trim().toLowerCase() === currentWord.toLowerCase();
    let newSessionScore = sessionScore;
    let newCorrectCount = sessionCorrectCount;

    if (isCorrect) {
      // Pass Path: Calculate points using a stacking streak multiplier.
      // Multiplier increases by +0.1 per streak up to a maximum cap of 2.0x bonus.
      if (!hasFailedCurrentWord) {
        const multiplier = Math.min(1 + (studentStreak * 0.1), 2); // Max 2x multiplier
        const basePoints = DIFFICULTY_POINTS[difficulty];
        const earned = Math.round(basePoints * multiplier);
        newSessionScore = sessionScore + earned;
        newCorrectCount = sessionCorrectCount + 1;
        
        setSessionScore(newSessionScore);
        setSessionCorrectCount(newCorrectCount);
        setStudentStreak(prev => prev + 1);
        setFeedback({ type: 'success', message: `Awesome! +${earned} session points` });
      } else {
        setFeedback({ type: 'success', message: 'Correct! Moving on.' });
      }
    } else {
      // Fail Path
      setStudentStreak(0);
      if (!hasFailedCurrentWord) {
        addStruggleWord(currentWord, tierId, 'spelling_error');
      }
      setHasFailedCurrentWord(true);
      setFeedback({ type: 'error', message: `Incorrect. The correct spelling is: ${currentWord}` });
      setShowWord(true);
      speakWord(); // Re-dictate core answer on error
    }

    const shouldAdvance = isCorrect || difficulty === 'easy';

    advanceTimeoutRef.current = setTimeout(() => {
      if (!isMountedRef.current) return;
      
      if (shouldAdvance) {
        if (currentWordIndex < words.length - 1) {
          setCurrentWordIndex(prev => prev + 1);
        } else {
          const accuracy = (newCorrectCount / words.length) * 100;
          const isPerfect = newCorrectCount === words.length;
          
          newSessionScore = calculateFinalSessionScore(words.length, difficulty, newSessionScore, isPerfect);
          
          const actualPointsAwarded = updateSectionScore(section.id, difficulty, newSessionScore, accuracy);
          
          setCompletionData({
            accuracy,
            sessionScore: newSessionScore,
            pointsAwarded: actualPointsAwarded
          });
          setIsSessionComplete(true);
        }
      } else {
        // Medium/Hard on fail: stay on word, clear feedback to allow retry
        setFeedback(null);
      }
      advanceTimeoutRef.current = null;
      isProcessingRef.current = false;
    }, 2000);
  };

  if (!section || words.length === 0) return <div>No words loaded.</div>;

  const easyScore = sectionScores[section.id + '-easy'] || 0;
  const mediumScore = sectionScores[section.id + '-medium'] || 0;
  const hardScore = sectionScores[section.id + '-hard'] || 0;
  const totalSectionScore = easyScore + mediumScore + hardScore;
  const maxEasyScore = words.length * DIFFICULTY_POINTS.easy * 2;
  const maxMediumScore = words.length * DIFFICULTY_POINTS.medium * 2;
  const maxHardScore = words.length * DIFFICULTY_POINTS.hard * 2;
  const maxPossibleScore = maxEasyScore + maxMediumScore + maxHardScore;

  const easyProg = maxEasyScore > 0 ? Math.max(0, Math.min((easyScore / maxEasyScore) * 100, 100)) : 0;
  const mediumProg = maxMediumScore > 0 ? Math.max(0, Math.min((mediumScore / maxMediumScore) * 100, 100)) : 0;
  const hardProg = maxHardScore > 0 ? Math.max(0, Math.min((hardScore / maxHardScore) * 100, 100)) : 0;

  const difficultyConfig = [
    { label: 'Easy Mode', score: easyScore, max: maxEasyScore, prog: easyProg, color: '#10b981' },
    { label: 'Medium Mode', score: mediumScore, max: maxMediumScore, prog: mediumProg, color: '#f59e0b' },
    { label: 'Hard Mode', score: hardScore, max: maxHardScore, prog: hardProg, color: '#ef4444' },
  ];

  // Sequential progression checks
  const isMediumUnlocked = isDifficultyUnlocked(section.id, 'medium');
  const isHardUnlocked = isDifficultyUnlocked(section.id, 'hard');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Main Interactive Workspace */}
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-start' }}>
        
        {/* POINTS REFERENCE SIDEBAR */}
        <div className="glass-panel animate-fade-in" style={{ padding: '1.75rem', width: '280px', borderLeft: '4px solid #fbbf24', background: 'linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', color: '#fbbf24' }}>
              <span style={{ fontSize: '1.5rem' }}>💎</span>
              <h3 style={{ textTransform: 'uppercase', letterSpacing: '1px', fontSize: '1rem' }}>Point Values</h3>
           </div>
           <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <li style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                 <span style={{ color: 'var(--text-secondary)' }}>🟩 Easy</span>
                 <strong style={{ color: 'white' }}>1 pt / word</strong>
              </li>
              <li style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                 <span style={{ color: 'var(--text-secondary)' }}>🟨 Medium</span>
                 <strong style={{ color: 'white' }}>3 pts / word</strong>
              </li>
              <li style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                 <span style={{ color: 'var(--text-secondary)' }}>🟥 Hard</span>
                 <strong style={{ color: 'white' }}>30 pts / word</strong>
              </li>
           </ul>
           
           <div style={{ marginTop: '1.5rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.15)', fontSize: '0.8rem', lineHeight: '1.5', color: 'var(--text-secondary)' }}>
              🔥 <strong>Bonus Multiply:</strong> Perfect streaks stack a bonus boost up to <strong>2.0x</strong> max per correct answer!
           </div>
        </div>

        <div className="glass-panel" style={{ padding: '2.5rem', width: '100%', minWidth: '320px', maxWidth: '600px', flex: '1 1 350px', textAlign: 'center', background: 'rgba(15, 23, 42, 0.6)' }}>
        {isSessionComplete ? (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: '2rem', color: 'white', marginBottom: '1.5rem' }}>Section Complete!</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
              <p style={{ color: 'var(--text-secondary)' }}>Accuracy: <strong style={{ color: 'white' }}>{Math.round(completionData?.accuracy)}%</strong></p>
              <p style={{ color: 'var(--text-secondary)' }}>Session Score: <strong style={{ color: 'white' }}>{completionData?.sessionScore}</strong></p>
              <p style={{ color: 'var(--text-secondary)' }}>New Points Awarded: <strong style={{ color: '#fbbf24' }}>{completionData?.pointsAwarded}</strong></p>
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button className="btn-primary" onClick={handleRetry}>
                Retry Section
              </button>
              <button className="btn-secondary" onClick={onComplete}>
                Back to Portal
              </button>
            </div>
          </div>
        ) : (
          <>
            {tierRule && (
              <div style={{ 
                  background: 'rgba(244, 63, 94, 0.12)', 
                  padding: '1rem', 
                  borderRadius: '8px', 
                  borderLeft: '4px solid var(--accent-color)', 
                  marginBottom: '1.75rem',
                  textAlign: 'left'
              }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-color)', fontWeight: 'bold', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                     <span>💡 Lesson Rule to Master:</span>
                  </div>
                  <p style={{ color: 'white', margin: 0, fontSize: '0.95rem', lineHeight: '1.4' }}>{tierRule}</p>
              </div>
            )}
            
            {/* Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
              <button className="btn-secondary" onClick={() => speakWord()}>
                🔊 Hear Word Again
              </button>
              <select 
                value={difficulty} 
                onChange={handleDifficultyChange}
                style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', cursor: 'pointer' }}
              >
                <option value="easy" style={{color: 'black'}}>Easy (Copy)</option>
                <option value="medium" disabled={!isMediumUnlocked} style={{color: isMediumUnlocked ? 'black' : '#94a3b8'}}>{isMediumUnlocked ? 'Medium (Recall)' : '🔒 Medium (Finish Easy First)'}</option>
                <option value="hard" disabled={!isHardUnlocked} style={{color: isHardUnlocked ? 'black' : '#94a3b8'}}>{isHardUnlocked ? 'Hard (Dictate)' : '🔒 Hard (Finish Medium First)'}</option>
              </select>
            </div>

            {/* Visual Support (The Word) */}
            <div style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem' }}>
              {showWord ? (
                <h2 style={{ fontSize: '3rem', letterSpacing: '2px', color: 'var(--text-primary)' }}>
                  {currentWord}
                </h2>
              ) : (
                <h2 style={{ fontSize: '3rem', color: 'rgba(255,255,255,0.1)' }}>
                  {/* Visual placeholder dots */}
                  {currentWord.split('').map(() => '•').join('')}
                </h2>
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={checkSpelling}>
              <input 
                ref={inputRef}
                type="text" 
                value={userInput}
                onChange={(e) => {
                  const value = e.target.value;
                  setUserInput(value);
                  
                  if (advanceTimeoutRef.current) {
                    clearTimeout(advanceTimeoutRef.current);
                    advanceTimeoutRef.current = null;
                    isProcessingRef.current = false;
                  }

                  if ((difficulty === 'medium' && !hasFailedCurrentWord) || 
                      (difficulty === 'hard' && hasFailedCurrentWord)) {
                    if (value === '') {
                      setShowWord(true);
                    } else if (showWord) {
                      setShowWord(false);
                    }
                  }
                  if (feedback?.type === 'error') {
                    setFeedback(null);
                  }
                }}
                placeholder="Type the word here..."
                style={{
                  width: '100%',
                  padding: '1rem',
                  fontSize: '1.5rem',
                  borderRadius: '12px',
                  border: '2px solid var(--surface-border)',
                  background: 'rgba(0,0,0,0.2)',
                  color: 'white',
                  textAlign: 'center',
                  marginBottom: '1rem',
                  outline: 'none'
                }}
                disabled={feedback?.type === 'success' || (difficulty === 'easy' && feedback)}
              />
              <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={feedback?.type === 'success'}>
                {feedback ? 'Checking...' : 'Check Spelling'}
              </button>
            </form>

            {/* Feedback Message */}
            {feedback && (
              <div 
                className="animate-fade-in"
                style={{ 
                  marginTop: '1.5rem', 
                  padding: '1rem', 
                  borderRadius: '8px', 
                  background: feedback.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                  color: feedback.type === 'success' ? 'var(--success-color)' : 'var(--error-color)',
                  fontWeight: 'bold'
                }}
              >
                {feedback.message}
              </div>
            )}

            {/* Progress */}
            <div style={{ marginTop: '2rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Word {currentWordIndex + 1} of {words.length} | Points: {totalSectionScore} / {maxPossibleScore}
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(0,0,0,0.2)', padding: '1.25rem', borderRadius: '12px', textAlign: 'left' }}>
              <h4 style={{ color: 'white', fontSize: '0.9rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.8 }}>Points Breakdown</h4>
              
              {difficultyConfig.map((diff) => (
                <div key={diff.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                    <span>{diff.label}</span>
                    <span style={{ color: 'white' }}>{diff.score} / {diff.max} pts</span>
                  </div>
                  <div 
                    role="progressbar" 
                    aria-label={diff.label}
                    aria-valuenow={diff.prog} 
                    aria-valuemin="0" 
                    aria-valuemax="100"
                    style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}
                  >
                    <div style={{ height: '100%', width: `${diff.prog}%`, background: diff.color, transition: 'width 0.4s ease-out' }} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        </div>
        
      </div>

      {/* FULL CURRICULUM REWARDS TRACKER AT THE BOTTOM */}
      <div className="glass-panel animate-fade-in" style={{ padding: '1.5rem', width: '100%', background: 'rgba(15, 23, 42, 0.4)', borderTop: '2px solid rgba(255, 255, 255, 0.05)' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.5rem' }}>🏆</span>
            <h3 style={{ margin: 0, color: 'white', fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rewards Track</h3>
            <span style={{ marginLeft: 'auto', color: '#fbbf24', fontWeight: 'bold' }}>Current Total: {studentPoints} pts</span>
         </div>
         <div style={{ 
             display: 'grid', 
             gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
             gap: '1rem' 
         }}>
            {[...(rewards || [])].sort((a, b) => a.cost - b.cost).map((rew) => {
                const prog = Math.min((studentPoints / rew.cost) * 100, 100);
                const isAchieved = studentPoints >= rew.cost;
                return (
                    <div key={rew.id} style={{ 
                        background: 'rgba(255, 255, 255, 0.05)', 
                        padding: '1rem', 
                        borderRadius: '8px', 
                        border: isAchieved ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.1)',
                        position: 'relative'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.5rem', color: 'white' }}>
                            <span style={{ fontWeight: isAchieved ? 'bold' : 'normal', opacity: isAchieved ? 1 : 0.9 }}>{rew.name}</span>
                            <span style={{ color: isAchieved ? '#10b981' : 'var(--text-secondary)', fontSize: '0.8rem' }}>{rew.cost}</span>
                        </div>
                        <div style={{ width: '100%', height: '6px', background: 'rgba(0,0,0,0.3)', borderRadius: '3px', overflow: 'hidden' }}>
                           <div style={{ 
                                height: '100%', 
                                width: `${prog}%`, 
                                background: isAchieved ? '#10b981' : '#3b82f6',
                                transition: 'width 0.4s ease-out'
                            }} />
                        </div>
                    </div>
                );
            })}
         </div>
      </div>

    </div>
  );
};

export default GameEngine;
