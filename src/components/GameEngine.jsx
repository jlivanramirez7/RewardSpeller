import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { playStaticAudio, playTTS, cancelTTS } from '../services/ttsService';

const GameEngine = ({ tierId, section, onComplete, tierRule }) => {
  const { setStudentStreak, studentStreak, addStruggleWord, updateSectionScore, isDifficultyUnlocked, rewards, studentPoints, sectionScores } = useAppContext();
  
  // Dynamically resolve closest unearned goal for real-time motivation (using safe immutable copy)
  const nextReward = [...(rewards || [])].sort((a, b) => a.cost - b.cost).find(r => r.cost > studentPoints) || rewards?.[rewards?.length - 1];
  
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [difficulty, setDifficulty] = useState('easy'); // easy, medium, hard
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: string }
  const [showWord, setShowWord] = useState(true);
  const [sessionScore, setSessionScore] = useState(0);
  const [sessionCorrectCount, setSessionCorrectCount] = useState(0);
  
  const inputRef = useRef(null);
  const isMountedRef = useRef(true); // Lifecycle guard
  
  const [shuffledWords, setShuffledWords] = useState([]);
  
  useEffect(() => {
    if (section?.words) {
      setShuffledWords([...section.words].sort(() => Math.random() - 0.5));
      setCurrentWordIndex(0);
    }
  }, [section]);

  // The word list for the current section
  const words = shuffledWords;
  const currentWordObj = words[currentWordIndex];
  const currentWord = currentWordObj?.word || '';



  // Text-to-Speech
  const speakWord = () => {
    if (!currentWordObj) return;
    const textToSpeak = `Listen closely, you must. The word is: ${currentWord}. Its meaning, ${currentWordObj.definition || ''} it is. Hear it in a sentence, you will: ${currentWordObj.sentence || ''}. The word, it is ${currentWord}.`;
    // Pattern matched filename: word_apple.mp3
    const safeWord = currentWord.toLowerCase().replace(/[^a-z0-9]/g, '');
    const filename = `word_${safeWord}.mp3`;

    // Dual-path dispatch: attempts local static playback, failovers automatically if absent.
    playStaticAudio(filename, null, null, textToSpeak, 'assessment');
  };

  // Cleanup TTS on unmount and mark unmounted
  useEffect(() => {
    isMountedRef.current = true; // RESTORE mounted state explicitly on mount/remount
    return () => {
      isMountedRef.current = false; // Block trailing timeouts
      cancelTTS();
    };
  }, []);

  useEffect(() => {
    if (words.length > 0) {
      startNewWord();
    }
  }, [currentWordIndex, difficulty, words.length]);

  const startNewWord = () => {
    setUserInput('');
    setFeedback(null);
    speakWord();
    
    if (difficulty === 'easy' || difficulty === 'medium') {
      setShowWord(true);
    } else {
      setShowWord(false);
    }
    
    setTimeout(() => {
      if (isMountedRef.current && inputRef.current) inputRef.current.focus();
    }, 50);
  };

  const handleDifficultyChange = (e) => {
    setDifficulty(e.target.value);
    setSessionScore(0);
    setSessionCorrectCount(0);
    setCurrentWordIndex(0);
  };

  const checkSpelling = (e) => {
    e.preventDefault();
    if (!userInput.trim() || feedback) return; // BLOCK if processing

    const isCorrect = userInput.toLowerCase() === currentWord.toLowerCase();
    let newSessionScore = sessionScore;
    let newCorrectCount = sessionCorrectCount;

    if (isCorrect) {
      // Pass Path
      const multiplier = Math.min(1 + (studentStreak * 0.1), 2); // Max 2x multiplier
      const basePoints = difficulty === 'hard' ? 30 : difficulty === 'medium' ? 3 : 1;
      const earned = Math.round(basePoints * multiplier);
      newSessionScore = sessionScore + earned;
      newCorrectCount = sessionCorrectCount + 1;
      
      setSessionScore(newSessionScore);
      setSessionCorrectCount(newCorrectCount);
      setStudentStreak(prev => prev + 1);
      setFeedback({ type: 'success', message: `Awesome! +${earned} session points` });
    } else {
      // Fail Path: No retries, direct advancement log
      setStudentStreak(0);
      addStruggleWord(currentWord, tierId, 'spelling_error');
      setFeedback({ type: 'error', message: `Incorrect. The correct spelling is: ${currentWord}` });
      speakWord(); // Re-dictate core answer on error
    }

    // Unconditional advancing after 2s
    setTimeout(() => {
      if (!isMountedRef.current) return;
      
      if (currentWordIndex < words.length - 1) {
        setCurrentWordIndex(prev => prev + 1);
      } else {
        const accuracy = Math.round((newCorrectCount / words.length) * 100);
        const actualPointsAwarded = updateSectionScore(section.id, difficulty, newSessionScore, accuracy);
        alert(`Section Complete!\n\nAccuracy: ${accuracy}%\nSession Score: ${newSessionScore}\nNew Points Awarded: ${actualPointsAwarded}\n\nKeep practicing on Hard to maximize your points!`);
        onComplete();
      }
    }, 2000);
  };

  if (!section || words.length === 0) return <div>No words loaded.</div>;

  const easyScore = sectionScores[section.id + '-easy'] || 0;
  const mediumScore = sectionScores[section.id + '-medium'] || 0;
  const hardScore = sectionScores[section.id + '-hard'] || 0;
  const totalSectionScore = easyScore + mediumScore + hardScore;
  const maxPossibleScore = words.length * 68;

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
              setUserInput(e.target.value);
              if (difficulty === 'medium' && showWord) {
                setShowWord(false);
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
            disabled={feedback !== null}
          />
          <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={feedback !== null}>
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
